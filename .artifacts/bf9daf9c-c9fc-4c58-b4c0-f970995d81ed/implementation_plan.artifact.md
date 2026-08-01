# Implementation Plan - CustomerProfile Migration Cleanup & Stabilization

This plan addresses the critical regressions from the `CustomerProfile` refactor, unifies the vendor assignment engine, and optimizes caching revalidation.

## User Review Required

> [!IMPORTANT]
> **Schema Integrity**: Every remaining `customerId` reference in the runtime code will be replaced with `customerProfileId` or `customerprofile.userId`. This is critical to prevent runtime crashes and `404` errors in the booking lifecycle.

> [!WARNING]
> **Vendor Assignment Consolidation**: I will centralize the assignment logic into a single service. This will resolve the conflict between the Cron job (looking for `REASSIGNED`) and Inngest functions (looking for `PENDING`).

## Proposed Changes

### 1. CustomerProfile Migration Cleanup

#### [MODIFY] [AuditService](file:///C:/ReactProjects/ManaEventWebApp/src/services/server/audit.service.ts)
- Replace `customerId` with `customerProfileId` in `AuditLogOptions` and `log` method.
- Update `logBooking` to correctly map the customer profile ID.

#### [MODIFY] [TimelineService](file:///C:/ReactProjects/ManaEventWebApp/src/services/server/timeline.service.ts)
- Update `transitionStatus` to fetch `customerprofile.userId` instead of `customerId` for socket emissions.
- Ensure all automated notifications use the correct user ID.

#### [MODIFY] [Booking API Routes]
- **[accept-counter](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/bookings/[id]/accept-counter/route.ts)**: Fix ownership check and relation query.
- **[accept](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/bookings/[id]/accept/route.ts)**: Fix socket notification target.
- **[view](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/bookings/[id]/view/route.ts)**: Fix Prisma select and socket notification.
- **[otp](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/bookings/otp/route.ts)**: Fix customer verification logic.

#### [MODIFY] [Customer Library](file:///C:/ReactProjects/ManaEventWebApp/src/lib/customer.ts)
- Replace all legacy `customerId` parameters and query filters.

### 2. Unified Vendor Assignment Engine

#### [MODIFY] [Assignment Intelligence](file:///C:/ReactProjects/ManaEventWebApp/src/lib/intelligence/assignment.ts)
- Refactor `handleVendorRejection` and `autoAssignVendor` to be the "source of truth".
- Ensure consistent status transitions (`PENDING`, `REASSIGNED`, `REJECTED`, `EXPIRED`).

#### [MODIFY] [Cron Reassignment](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/cron/assignments/route.ts)
- Delegate logic to the centralized `AssignmentService`.
- Fix the status query to properly pick up queued vendors (`REASSIGNED`).

#### [MODIFY] [Inngest Functions](file:///C:/ReactProjects/ManaEventWebApp/src/inngest/booking-functions.ts)
- Synchronize `handle-vendor-rejection` and `vendor-timeout-reassignment` with the unified service logic.

### 3. Cache Optimization

#### [MODIFY] [Marketplace](file:///C:/ReactProjects/ManaEventWebApp/src/lib/marketplace.ts)
- Add `revalidateTag` calls for `categories` and `event-types` in admin routes.
- Reduce default `unstable_cache` TTL to 5 minutes (300s) for high-traffic data.

#### [MODIFY] [Vendor Library](file:///C:/ReactProjects/ManaEventWebApp/src/lib/vendor.ts)
- Implement `revalidateTag('subscriptions')` in the subscription verification route.
- Reduce cache TTL for subscription plans.

## Verification Plan

### Automated Tests
- Run `npx prisma validate` to confirm schema compatibility.
- Perform a dry-run of the Cron job via API to verify reassignment transitions.
- Verify all `customerId` greps return no results in `src/`.

### Manual Verification
- Create a booking as a customer and verify it appears in the dashboard (fixes `customerId` query issue).
- Reject a booking as a vendor and verify the next vendor receives it (fixes assignment logic).
- Confirm "My Reviews" and "Invoices" load correctly for the customer.
