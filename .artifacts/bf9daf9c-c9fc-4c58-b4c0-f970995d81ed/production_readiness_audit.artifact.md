# Production Readiness Audit Report - Mana Events

**Audit Date**: 2026-07-22
**Status**: ⚠️ **ACTION REQUIRED**
**Overall Readiness Score**: **65/100**

---

## 1. Executive Summary
The application has a robust core architecture and comprehensive features. However, the recent `CustomerProfile` migration has left behind a trail of critical regressions. Multiple core API routes and services are currently broken due to references to the dropped `customerId` field. Stabilization of the vendor assignment engine is partially complete but faces logic inconsistencies across different execution contexts (Cron vs. Inngest).

---

## 2. Critical Issues (Blockers)

### 🚨 Dropped Column Regressions (`customerId`)
Multiple files still reference `booking.customerId` or `audit_log.customerId`, which were dropped in the latest schema refactor. These will cause runtime crashes or incorrect `404` responses.

| File Path | Issue | Impact |
| :--- | :--- | :--- |
| `src/app/api/bookings/[id]/accept-counter/route.ts` | Uses `booking.customerId` for ownership check. | **Broken**: Customers cannot accept counter-quotes. |
| `src/app/api/bookings/[id]/accept/route.ts` | Uses `booking.customerId` for socket emission. | **Broken**: Real-time notifications fail on acceptance. |
| `src/app/api/bookings/[id]/view/route.ts` | Explicitly selects `customerId` in Prisma query. | **Broken**: Route crashes with Prisma error. |
| `src/app/api/customer/invoices/route.ts` | Queries `invoice` via `booking.customerId`. | **Broken**: Invoices page empty or crashes. |
| `src/services/server/audit.service.ts` | Attempts to create `audit_log` with `customerId`. | **Broken**: Every audit log attempt for customers fails. |
| `src/services/server/timeline.service.ts` | Uses `booking.customerId` for status transition alerts. | **Broken**: Status updates fail to notify customers. |

### 🚨 Relation Path Mismatches
`lib/reviews.ts` was found to be querying `user` directly on `review`, which is invalid. (Fixed in recent stabilization, but other similar patterns may exist).

---

## 3. High Priority Issues

### 🔄 Inconsistent Assignment Logic
Business logic for "Next Vendor Reassignment" is duplicated and inconsistent across three systems:
1.  **Cron Job** (`api/cron/assignments`): Looks for `REASSIGNED` status (Correct for matching queue).
2.  **Inngest Function** (`handle-vendor-rejection`): Looks for `PENDING` status (Incorrect for matching queue).
3.  **Intelligence Service** (`assignment.ts`): Standalone logic that may conflict with Inngest triggers.

> [!CAUTION]
> If both Cron and Inngest trigger for the same booking, it could lead to double-assignment or race conditions in the timeline.

### ⚡ Stale Cache Issues
Multiple `unstable_cache` implementations lack revalidation triggers.
- `subscriptions`: Never revalidated; plan changes take 24h to appear.
- `categories`: Cache is not cleared when admin updates categories.
- `event-types`: Cache is not cleared when new event types are added.

---

## 4. Performance Observations

### 🐢 N+1 Prisma Queries
- **Cron Job**: The assignment reassignment loop performs ~5 DB queries per expired booking. Scaling to thousands of bookings will significantly slow down the cron execution.
- **Marketplace**: `getMarketplaceVendors` performs a raw SQL distance calculation correctly, but the subsequent mapping layer for scores is performed sequentially in memory.

---

## 5. Security Observations
- **Authorization**: Ownership checks using `payload.userId` are present in most routes, but the `customerId` regression has bypassed these checks (causing them to fail closed, which is safe but broken).
- **Environment**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is currently missing/empty in `.env`, breaking all proximity features.

---

## 6. Database Observations
- **Indexing**: Excellent index coverage on foreign keys and commonly filtered fields (`status`, `createdAt`, etc.).
- **Integrity**: `Renamedpackage` (mapped to `package`) uses JSON for inclusions. This makes guest-count-based reporting difficult compared to structured relations.

---

## 7. Deployment Readiness Checklist

- [ ] **DB Migrations**: Ensure `prisma migrate deploy` is run to sync the dropped `customerId` column.
- [ ] **Env Vars**: Set valid `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- [ ] **Env Vars**: Verify `APP_CONFIG.cronSecret` matches the authorized header in production crons.
- [ ] **Cleanup**: Run a global search for `customerId` and replace with `customerProfileId` or `customerprofile.userId` as appropriate.
- [ ] **Validation**: Run `npx prisma validate` and `npm run build` to catch remaining TypeScript/Schema mismatches.

---

## 8. Final Recommendation
**Do not deploy to production** until the `customerId` regressions are resolved. These are not minor bugs; they break the core booking lifecycle for customers and the auditing system for admins.
