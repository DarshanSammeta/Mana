# TECHNICAL ARCHITECTURE MASTER - Mana Events Marketplace

## TABLE OF CONTENTS
1. [Project Overview](#1-project-overview)
2. [Project Structure](#2-project-structure)
3. [Complete File Documentation](#3-complete-file-documentation)
4. [Database Schema](#4-database-schema)
5. [API Documentation](#5-api-documentation)
6. [Services Layer](#6-services-layer)
7. [Component Architecture](#7-component-architecture)
8. [Hooks & State Management](#8-hooks--state-management)
9. [Libraries & Integrations](#9-libraries--integrations)
10. [Redis Strategy](#10-redis-strategy)
11. [Search Engine (Meilisearch)](#11-search-engine)
12. [Real-time Communication (Socket.io)](#12-real-time-communication)
13. [Background Jobs (Inngest)](#13-background-jobs)
14. [Security Posture](#14-security-posture)
15. [Performance Optimization](#15-performance-optimization)
16. [Environment Variables](#16-environment-variables)
17. [Dependency Graph](#17-dependency-graph)
18. [Request Lifecycle](#18-request-lifecycle)
19. [Feature Matrix](#19-feature-matrix)
20. [Known Issues & Roadmap](#20-known-issues)
21. [Deployment & Infrastructure](#21-deployment)
22. [Project Statistics](#22-project-statistics)
23. [Maintenance & Development Guide](#23-maintenance-guide)

---

## 1. PROJECT OVERVIEW

### Project Purpose
Mana Events is a comprehensive ecosystem designed to professionalize the event management industry. It serves as a bridge between vendors (caterers, decorators, venues) and customers (event organizers, individuals).

### Marketplace Architecture
The platform follows a **Modular Monolith** pattern. While deployed as a single Next.js application, the logic is strictly separated into Services, Repositories (Prisma), and Transport layers (API/Socket).

### Core Lifecycles
- **Booking Lifecycle**: `Search -> Inquire -> Quote -> Payment -> Execution -> Review`.
- **Payment Lifecycle**: `Escrow -> Event Completion -> Payout -> Commission Deducted`.
- **Vendor Matching**: Automated dispatch of leads to qualified vendors based on proximity and rating.

---

## 2. PROJECT STRUCTURE

### `src/` Directory Breakdown
- **`app/`**: Next.js App Router. Contains pages, layouts, and API routes.
  - *Who uses it*: Frontend developers and external API consumers.
  - *Purpose*: Routing and entry points.
- **`components/`**: UI components categorized by domain.
  - *ui/*: Atomic shadcn/ui components.
  - *marketplace/*: Search bars, vendor cards, filter panels.
- **`services/`**: Business logic. Each service is responsible for a specific domain.
  - *Purpose*: Abstract database and third-party complexity from the UI.
- **`lib/`**: Singletons and utility wrappers.
  - *prisma.ts*: Shared database client with middleware for logging.
  - *redis.ts*: Multi-client Redis wrapper (Upstash REST + ioredis).
- **`inngest/`**: Durable execution functions for background tasks.

---

## 3. COMPLETE FILE DOCUMENTATION (SELECT EXAMPLES)

### `src/services/auth.service.ts`
- **Purpose**: Core authentication logic.
- **Calls**: Prisma for user lookup, Redis for OTP storage.
- **Security**: Implements "Fail-Open" rate limiting to ensure availability during Redis outages.

### `src/lib/rate-limit.ts`
- **Purpose**: Enterprise rate limiter.
- **Algorithm**: Fixed window counter using Redis `INCR` and `EXPIRE`.
- **Handling**: Returns a `RateLimitResult` containing `retryAfter` for UI feedback.

---

## 4. DATABASE SCHEMA (PRISMA)

### `User` Model
- **Field `role`**: Enum `[CUSTOMER, VENDOR, ADMIN]`.
- **Field `lockUntil`**: Used for account lockout after 5 failed login attempts.
- **Indexes**: Unique constraint on `email` and `mobileNumber`.

### `VendorProfile` Model
- **Purpose**: Extended data for vendors.
- **Fields**: `businessName`, `location` (GeoJSON compatible), `rating`, `verificationStatus`.

---

## 5. API DOCUMENTATION

### `POST /api/auth/login`
- **Rate Limit**: 5/15min (Prod), 100/min (Dev).
- **Process**: Verifies credentials -> Checks for 2FA -> Sends OTP via Resend if enabled -> Returns JWT.

### `POST /api/bookings/create`
- **Middleware**: Requires `CUSTOMER` role.
- **Action**: Creates a `PENDING` booking and initiates a 30-minute expiration timer via Inngest.

---

## 6. SERVICES LAYER

### `FinanceService`
- **Responsibilities**: Ledger integrity, refund processing, settlement calculations.
- **Methods**: `processRefund(transactionId)`, `calculateCommission(amount)`.

### `MatchingService`
- **Responsibilities**: Proximity search for vendors.
- **Dependencies**: Redis GEOSPATIAL index.

---

## 7. REDIS STRATEGY

### Cache Hierarchy
1. **L1 (In-Memory)**: Very short-lived results (10s) for high-traffic counts.
2. **L2 (Redis)**: API responses, session fragments, and rate limit counters.

### Key Naming Convention
- `ratelimit:<action>:<ip>:<identifier>`
- `cache:vendor:profile:<id>`
- `socket:user:presence:<id>`

---

## 8. SECURITY POSTURE

### Rate Limiting (Enterprise-Grade)
- **Multi-Factor**: Keys are generated using `Action + IP + UserIdentifier`.
- **Resilience**: Fail-open strategy prevents infrastructure outages from locking users out.
- **Visibility**: All rate-limit triggers are logged to the central logging service.

### Authentication
- **JWT**: Short-lived Access Tokens (15m), Long-lived Refresh Tokens (7d).
- **Storage**: HTTP-only, Secure, SameSite cookies.

---

## 9. MAINTENANCE GUIDE

### Coding Standards
- **Validation**: Every API input must be validated with Zod.
- **Error Handling**: Use the `withErrorHandler` wrapper for all API routes.
- **Logging**: Use `logger.info/warn/error` for critical path tracing.

### Deployment Flow
- **CI/CD**: Automatic migrations run on every deploy to Staging/Production.
- **Health Checks**: Redis, Meilisearch, and Prisma connection states are monitored via `/api/health`.

---

*Document generated on: 2024-07-13. Version: 2.1.0-STABLE*
