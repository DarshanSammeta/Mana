# Implementation Plan — Mana Events Enterprise Refactor

This plan follows the phases outlined in the master implementation prompt, focusing on a production-grade refactor of the Mana Events platform.

## Goal
Transform Mana Events into a production-ready enterprise platform by auditing the architecture, cleaning up technical debt, and implementing advanced customer experience features (Cart, Checkout, Payments).

## Phase 1: Complete Project Audit [DONE]
- [x] Folder and Module Audit
- [x] File and Component Audit
- [x] Service and API Audit
- [x] Database (Prisma) Audit
- [x] Authentication and Security Audit
- [x] Performance and Build Audit
- [x] **Audit Report Generated**: [audit_report.artifact.md](file:///C:/ReactProjects/ManaEventWebApp/.artifacts/f2873e1f-5f89-446e-93a9-175c9a60acac/audit_report.artifact.md)

## Phase 2: Cleanup (Requires Approval)
After approval of the Audit Report, the following cleanup will be performed:
- [ ] Remove deprecated Prisma models (`activitylog`, `auditlog`).
- [ ] Merge duplicate Booking API endpoints and services.
- [ ] Consolidate duplicate components (e.g., `BookingTimeline`).
- [ ] Remove unused test files and documentation from the source tree.
- [ ] Refactor fragmented Auth logic into a unified module.

## Phase 3: Amazon-Style Customer Experience
Enhancing the booking flow to a professional cart-to-confirmation experience.

### 1. Advanced Shopping Cart
- [ ] Extend `Cart` and `CartItem` models in Prisma.
- [ ] Implement multi-vendor support within a single cart.
- [ ] Add guest count and quantity management.
- [ ] Implement price breakdown including taxes and platform fees.

### 2. Offers & Coupons Engine
- [ ] Implement platform-wide and vendor-specific offer logic.
- [ ] Create an "Auto-apply best coupon" feature.

### 3. Enterprise Checkout & Payments
- [ ] Implement a multi-step checkout flow (Address -> Review -> Payment).
- [ ] Integrate Razorpay for UPI, Cards, and Net Banking.
- [ ] Support Advance vs. Balance payment splits.

### 4. Dashboards & Tracking
- [ ] Enhance Customer Dashboard with event timelines.
- [ ] Enhance Vendor Dashboard with better settlement tracking.

## User Review Required

> [!IMPORTANT]
> **Consolidation of Booking APIs**: I propose merging `/api/customer/bookings` and `/api/bookings` into a single, highly optimized endpoint that uses RBAC to determine field visibility. This simplifies maintenance and improves performance.

> [!IMPORTANT]
> **Database Renaming**: I recommend renaming `Renamedpackage` to `ServicePackage` in the Prisma schema for better readability, despite it being a reserved word in some contexts (Prisma handles this with `@@map`).

## Open Questions
1. Do you have a preferred naming convention for unified services (e.g., `BookingService` vs `UnifiedBookingService`)?
2. For the "Amazon-Style" cart, should we support guest checkouts, or is mandatory registration preferred?

## Verification Plan
### Automated Tests
- Run `npm run lint` and `npm run build` after each phase.
- Execute existing unit tests with `vitest`.
- Add new tests for the Cart and Offer logic.

### Manual Verification
- Verify the checkout flow on a staging-like environment (local dev).
- Test Razorpay integration using test credentials.
