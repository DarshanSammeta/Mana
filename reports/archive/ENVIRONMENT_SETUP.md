# Environment Setup Guide

This document outlines the environment variables required to run the Mana Events Marketplace.

## Critical Security Requirement (Fail-Fast)
The application validates these variables at startup. In production, the application will **FAIL TO START** if these are missing.

| Variable | Description | Security Requirement |
| :--- | :--- | :--- |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | Minimum 32 chars, Random |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Minimum 32 chars, Random |
| `NEXTAUTH_SECRET` | Secret for NextAuth session encryption | High Entropy |

## Essential Configuration

### Database
* `DATABASE_URL`: Connection string for Prisma. Typically a PostgreSQL URL with PgBouncer enabled (port 6543 on Supabase).
* `DIRECT_URL`: Direct connection string for Prisma migrations (port 5432 on Supabase).

### Authentication & App Core
* `NEXTAUTH_URL`: The base URL of the application (e.g., `https://manaevents.com`).
* `NEXT_PUBLIC_APP_URL`: The public URL of the frontend.
* `NEXT_PUBLIC_API_URL`: The public URL of the API (usually `${NEXT_PUBLIC_APP_URL}/api`).
* `NODE_ENV`: Set to `production` in live environments.
* `CRON_SECRET`: Secret key to authorize cron job requests.

## Service Integrations

### Razorpay (Payments)
* `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Public key for the frontend SDK.
* `RAZORPAY_KEY_ID`: API Key ID.
* `RAZORPAY_KEY_SECRET`: API Key Secret.
* `RAZORPAY_WEBHOOK_SECRET`: Secret for verifying webhook signatures.

### Email & SMS
* `RESEND_API_KEY`: API key for sending emails via Resend.
* `TWILIO_ACCOUNT_SID`: Twilio account identifier.
* `TWILIO_AUTH_TOKEN`: Twilio authentication token.
* `TWILIO_PHONE_NUMBER`: The Twilio number to send SMS from.

### Search & Caching
* `MEILISEARCH_HOST`: Host URL for the Meilisearch instance.
* `MEILISEARCH_API_KEY`: Master or Search key for Meilisearch.
* `UPSTASH_REDIS_REST_URL`: REST URL for Upstash Redis.
* `UPSTASH_REDIS_REST_TOKEN`: REST token for Upstash Redis.

### Media & Maps
* `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Cloud name for Cloudinary.
* `CLOUDINARY_API_KEY`: API key.
* `CLOUDINARY_API_SECRET`: API secret.
* `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: API key for Google Maps components.
* `GOOGLE_MAPS_API_KEY`: API key for server-side Google Maps requests.

## Validation Strategy
The application uses a "fail-fast" approach for critical variables and "warn-only" for non-critical ones during startup. Ensure all "Critical" variables are present in your `.env` or deployment environment to avoid runtime errors.
