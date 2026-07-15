# Deployment & Operations Guide - Mana Events

This guide provides the definitive procedures for deploying, monitoring, and maintaining the Mana Events Marketplace in a production environment.

## 1. Prerequisites
- **Server**: Linux (Ubuntu 22.04 LTS recommended)
- **Runtimes**: Docker Engine & Docker Compose
- **Managed Services**:
  - PostgreSQL (Supabase/Direct)
  - Upstash Redis
  - Cloudinary (Media)
  - Meilisearch (Self-hosted or Cloud)
  - Razorpay, Resend, Twilio accounts

## 2. Environment Configuration
Ensure `.env.production` is configured as per the `ENVIRONMENT_SETUP.md`. Critical secrets (JWT, NextAuth) must be high-entropy strings.

## 3. Docker Deployment Workflow
The application uses a multi-stage build optimized for production.

### 3.1. Build and Start
```bash
# Pull latest and rebuild
docker-compose pull
docker-compose up -d --build
```

### 3.2. Database Migrations
Always run migrations before or immediately after a new deployment.
```bash
docker exec -it mana-app-1 npx prisma migrate deploy
```

## 4. Nginx Configuration (Reverse Proxy)
Hardened Nginx configuration to handle SSL, Gzip, and WebSockets.

```nginx
server {
    listen 80;
    server_name api.manaevents.in; # Example
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.manaevents.in;

    ssl_certificate /etc/letsencrypt/live/manaevents.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/manaevents.in/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 5. Rollback Procedures
If a deployment fails or introduces critical bugs, follow these steps:

### 5.1. App Rollback
Revert to the previous stable Docker image tag:
```bash
docker-compose stop mana-app
docker-compose rm -f mana-app
# Edit docker-compose.yml to previous version tag
docker-compose up -d mana-app
```

### 5.2. Database Rollback
If a migration was catastrophic, restore the latest backup:
```bash
# Example for PostgreSQL
psql -h host -U user -d mana < backup_2023_xx_xx.sql
```
*Note: Database rollbacks should be avoided; prefer forward-fixing where possible.*

## 6. Monitoring & Maintenance
- **Health Checks**: Monitor `https://api.manaevents.in/api/health`.
- **Log Inspection**: `docker logs -f mana-app-1 | grep ERROR`.
- **Performance**: Monitor Meilisearch latency and Redis hit rates via their respective dashboards.
- **Daily Tasks**: Verified via Inngest (Settlements at 2 AM).
