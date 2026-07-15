# Mana Events Production Deployment Checklist

## 1. Domain & DNS
- [ ] Domain registered (e.g., manaevents.com)
- [ ] Cloudflare / DNS Provider configured
- [ ] SSL/TLS Certificate active (Full/Strict mode)
- [ ] Root domain and `www` redirects set up

## 2. Infrastructure
- [ ] VPS / Cloud Server (Ubuntu 22.04+ / Amazon Linux 2023)
- [ ] Minimum 4GB RAM, 2 vCPU recommended
- [ ] Docker & Docker Compose installed
- [ ] Nginx configured as reverse proxy with SSL
- [ ] Firewall (UFW/Security Groups) allowing 80, 443, 22

## 3. Database & Cache
- [ ] PostgreSQL 15+ Instance (Supabase/AWS RDS)
- [ ] Connection Pooling enabled (PgBouncer)
- [ ] Upstash Redis REST URL and Token verified
- [ ] Meilisearch instance deployed and indexed
- [ ] Database Backups scheduled (Daily)

## 4. API & External Services
- [ ] Razorpay Live Key ID and Secret
- [ ] Cloudinary Cloud Name and API Keys
- [ ] Resend API Key for Transactional Emails
- [ ] Google Maps API Key (Restricted to Domain)
- [ ] Twilio Account SID and Auth Token (If using SMS)
- [ ] Inngest Signing Key (For background jobs)

## 5. Security & Monitoring
- [ ] `.env.production` secrets generated (JWT_SECRET, etc.)
- [ ] Sentry DSN for Error Tracking
- [ ] Uptime monitoring (Better Stack / UptimeRobot)
- [ ] Rate limiting verified on critical API routes
- [ ] OWASP Dependency Audit performed

## 6. Optimization
- [ ] PWA Manifest and Icons verified
- [ ] Image compression via Cloudinary verified
- [ ] Next.js Build successful with No Errors
- [ ] Database indexes optimized for search queries

## 7. Monthly Cost Estimates (Approximate)
| Service | Tier | Cost |
|---------|------|------|
| VPS (DigitalOcean/Hetzner) | 4GB RAM | $24 |
| Database (Supabase) | Pro | $25 |
| Redis (Upstash) | Pay-as-you-go | ~$0 |
| Search (Meilisearch) | Self-hosted | Included in VPS |
| Emails (Resend) | Free/Starter | $0 - $20 |
| Payments (Razorpay) | Transaction Fee | 2-3% |
| **Total Base Cost** | | **~$50 - $70 / mo** |
