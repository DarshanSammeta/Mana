# Mana Events – Operations Checklist

This document provides the standard operating procedures for deploying, maintaining, and recovering the Mana Events production platform.

## 🚀 Deployment Workflow
1. **Infrastructure Provisioning**: Ensure PostgreSQL, Redis (Upstash), Meilisearch, and Inngest are provisioned.
2. **Environment Configuration**: Set all variables listed in `.env.example`.
3. **Database Migration**:
   ```bash
   npx prisma migrate deploy
   ```
4. **Build \u0026 Deploy**:
   - Vercel: Automatic via Git.
   - Docker: `docker compose up --build -d`.
5. **Post-Deployment Verification**:
   - Check `/api/health` and `/api/ready`.
   - Run Meilisearch sync: `npm run meili:sync`.

## 🔄 Rollback Strategy
1. **Code Rollback**:
   - Vercel: Revert to previous successful deployment.
   - Docker: `docker tag previous_image latest \u0026\u0026 docker compose up -d`.
2. **Database Rollback**:
   - If a migration failed: Restore from the latest snapshot before applying the migration.
   - **Warning**: Prisma migrations cannot be automatically undone if they involve destructive changes.

## 💾 Backup \u0026 Restore
- **Database**:
  - Frequency: Daily automated snapshots (Supabase/RDS).
  - Manual Backup: `pg_dump $DATABASE_URL \u003e backup.sql`.
- **Redis**: Not required (Ephemeral cache).
- **Files**: All user uploads are in Cloudinary (SaaS backup).

## 📈 Monitoring \u0026 Health
- **Active Probes**:
  - `/api/ready`: Lightweight status for Load Balancers.
  - `/api/health`: Deep dependency health check.
- **Log Management**:
  - Winston logs are sent to `STDOUT` (Standard Output).
  - Use Datadog, Logtail, or CloudWatch to ingest.
- **Tracing**:
  - OpenTelemetry OTLP exporters are configured via environment variables.

## 🛠️ Maintenance Tasks
- **Cache Invalidation**:
  - Reset Redis: `redis-cli FLUSHALL`.
- **Search Re-indexing**:
  - `npm run meili:sync`.

## 🚨 Emergency Contacts
- **Tech Lead**: [Placeholder]
- **DevOps**: [Placeholder]
- **Supabase Support**: [Portal]
- **Razorpay Status**: [Status Page]
