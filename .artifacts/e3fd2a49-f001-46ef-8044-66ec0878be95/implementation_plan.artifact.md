# Implementation Plan - Phase 1.5: Performance & Final Production Optimization

Achieve production-grade performance, scalability, and observability for the Mana Event Web App.

## Performance Baseline (Current State)
- **Build Time:** ~66s (Next.js compilation).
- **Bundle Size:** 103kB shared JS; 486kB max route JS (`/vendor/earnings`).
- **Warm API Latency:** 100ms - 500ms (Target: < 200ms).
- **Cold API Latency:** 800ms - 2000ms (Target: < 800ms).
- **Production Readiness Score:** ~85%.

---

## Proposed Optimizations

### 1. Frontend: Bundle Size & Hydration
**Goal:** Reduce First Load JS for heavy dashboards.
- **Lazy Loading:** Dynamically import heavy charting (`recharts`) and map (`leaflet`) components with `Suspense` placeholders.
- **Target Pages:** `/admin`, `/vendor/earnings`, `/map`.
- **RSC Migration:** Convert static informational sections in `/marketplace` and `/about` to React Server Components to eliminate client JS.

### 2. API: Caching & Latency (Observability)
**Goal:** Achieve < 200ms warm response time.
- **Middleware Overhead:** Optimize JWT verification; ensure no redundant DB hits in middleware.
- **Redis Integration:** Implement response caching for `GET /api/marketplace/services` and `GET /api/categories`.
- **Serialization:** Use `ApiResponse` helper to standardize and prune payloads.

### 3. Database: Connection & Pooling
**Goal:** Prevent connection exhaustion under load.
- **Pool Tuning:** Optimize Prisma connection pool settings for Serverless/Node environments.
- **Transaction Audit:** Ensure long-running transactions (Order creation) don't block the pool.

### 4. Production Observability
- **Request Tracing:** Ensure `x-request-id` is propagated through all service layers.
- **Heartbeat:** Stabilize `/api/ready` to check all critical dependencies (DB, Redis, Inngest).

---

## Implementation Checklist

### [STEP 1] Frontend Optimization (Dashboard)
- [ ] Dynamically import `Recharts` in `src/app/vendor/earnings/page.tsx`.
- [ ] Dynamically import `Leaflet` in `src/app/admin/analytics/page.tsx`.

### [STEP 2] API & Middleware Hardening
- [ ] Deploy standardized `ApiResponse` to top 10 high-traffic endpoints.
- [ ] Implement Redis-backed caching for Marketplace Search.

### [STEP 3] Load Testing & Benchmarking
- [ ] Run automated probe scripts to measure P99 latency.
- [ ] Run `npm run build` and compare bundle sizes.

---

## Verification Plan

### Manual Verification
- **Lighthouse:** Run local Lighthouse audit on Home and Marketplace.
- **DevTools:** Verify `recharts` chunk is only loaded when visiting the Earnings page.
- **Logs:** Confirm `executionTime` is tracked in structured logs.

### Success Criteria
✓ Performance score > 95 in Lighthouse.
✓ Shared bundle size < 110kB.
✓ Zero "Placeholder" APIs enabled in production.
