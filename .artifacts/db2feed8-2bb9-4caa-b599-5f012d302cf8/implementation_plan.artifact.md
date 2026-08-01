# Database Performance Regression Fix

Severe performance regression identified as a regression of the database connection configuration in production. API routes are taking 3-30s due to connection pooling bottlenecks and unnecessary transaction wrapping (BEGIN/COMMIT/DEALLOCATE ALL) caused by missing statement cache configuration.

## User Review Required

> [!IMPORTANT]
> The `env.production` file was found to have `connection_limit=1` and is missing `statement_cache_size=0`. This is the primary cause of the reported bottleneck.

> [!WARNING]
> **Sizing Confirmation**: Using `connection_limit=10` per instance. On a Supabase Free plan (max 60 connections), this allows for ~6 concurrent serverless instances. On Pro (max 200+), it allows for 20+. Please verify the Supabase dashboard (Database -> Settings) to ensure the total `connection_limit` across all active instances doesn't exceed the plan's limit.

## Open Questions

- **Regression Source**: `env.production` was likely updated manually or via a template that reverted the previous fix. We need to ensure the Production Hosting Provider's Environment Settings (e.g. Railway, Render, or VPS .env) match these corrected values, as local `.env` files are typically ignored in production.
- **Staging Verification**: We will apply these changes to a staging environment and run `scripts/performance-bench.ts` to verify the fix before moving to production.

## Proposed Changes

### Configuration

#### [MODIFY] [env.production](file:///C:/ReactProjects/ManaEventWebApp/env.production)
- Update `connection_limit` from `1` to `10`.
- Append `&statement_cache_size=0` to `DATABASE_URL`.

#### [MODIFY] [.env](file:///C:/ReactProjects/ManaEventWebApp/.env)
- Ensure consistency with production settings (already has `connection_limit=10` and `statement_cache_size=0`).

### API Optimization

#### [MODIFY] [src/app/api/notifications/preferences/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/notifications/preferences/route.ts)
- Remove the 5s `Promise.race` timeout. The underlying query is indexed on `userId` and will be fast once the connection bottleneck is removed.

### Infrastructure & Clean-up

#### [DELETE] [env.production](file:///C:/ReactProjects/ManaEventWebApp/env.production)
- Delete the file from the repository to ensure the Production Hosting Provider's Environment Settings remains the single, un-conflicted source of truth.

#### [MODIFY] [middleware.ts](file:///C:/ReactProjects/ManaEventWebApp/src/middleware.ts)
- Update the matcher to exclude `/icons/` and `manifest.json` to prevent unnecessary middleware execution and 404s.

#### [MODIFY] [package.json](file:///C:/ReactProjects/ManaEventWebApp/package.json)
- Update `dev` script to `"npx tsx watch server.ts"` to match the production custom server architecture.

## Verification Plan

### Staging Verification
1.  Set up a staging environment with the new `DATABASE_URL` parameters.
2.  Run `npm run verify` and `ts-node scripts/performance-bench.ts`.
3.  Monitor logs to confirm `BEGIN/COMMIT/DEALLOCATE` blocks are gone for simple READs.

### Production Rollout
1.  Update Production Environment variables in the hosting provider's panel.
2.  Trigger a new deployment to reset connection pools gracefully.
3.  Monitor the `api/health` endpoint and CloudWatch/Vercel logs for any connection exhaustion errors.

