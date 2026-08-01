# Project Architecture Audit Report — Mana Events

## 1. Folder Audit
- **Duplicate Modules**: Found `src/app/api/customer/bookings` and `src/app/api/bookings`. Both handle fetching individual bookings and lists, leading to logic fragmentation.
- **Inconsistent Structure**: `src/components/common` contains a `Navbar.tsx` which wraps components from `src/components/navigation`. Navigation components should be consolidated.
- **Hybrid Router**: The presence of `src/pages/api/socket` alongside a large `src/app/api` structure indicates a partial migration or a specific workaround for Socket.io. `src/pages/api/socket` appears empty upon initial inspection, which should be verified.

## 2. File Audit
- **Unused/Test Files**:
    - `src/app/api/auth/test-phase1` (Test endpoint)
    - `src/app/admin/reports/feature-matrix.md` (Documentation in code directory)
- **Duplicate Implementation Files**:
    - `src/components/booking/BookingTimeline.tsx` vs `src/components/booking/timeline/BookingTimeline.tsx`
- **Potential Obsolete Files**: `src/lib/serialization.ts` needs verification for usage.

## 3. Component Audit
- **Duplicate Components**:
    - `BookingTimeline`: Two versions exist with different feature sets and styles.
    - `Navbar` vs `MainNavbar`/`SubNavbar`: Wrapper logic is scattered between `common` and `navigation`.
- **Large Components**: `MarketplaceClient.tsx` and `VendorProfileClient.tsx` are likely candidates for further decomposition.

## 4. Hook Audit
- **Redundant Logic**: `useCommerce.ts` and `useCommerceSync.ts` are related but `useCommerceSync` contains complex merge logic that might be better suited for a service.
- **Hook Proliferation**: Many domain-specific hooks (e.g., `use-finance`, `use-operations`, `use-marketing`) should be checked for consistent use of `apiClient` and error handling.

## 5. Service Audit
- **Duplicate API Logic**: `customer.service.ts` and `booking.service.ts` both implement methods to fetch bookings by ID from different endpoints (`/api/customer/bookings/[id]` vs `/api/bookings/[id]`).
- **Server/Client Separation**: Generally good, but some server services (e.g., `pricing.service.ts`) are very large and handle multiple responsibilities (validation, calculation, snapshotting).

## 6. API Audit
- **Duplicate Endpoints**: `/api/bookings/[id]` and `/api/customer/bookings/[id]`.
- **Inconsistent Error Handling**: While `withErrorHandler` is used in many routes, some legacy or specific routes (like the cart API) might have manual try-catch blocks.
- **Missing Pagination**: Many `findMany` calls (e.g., in `/api/customer/bookings`) have a hardcoded `take: 10` but no proper cursor-based or offset-based pagination implementation in the params.

## 7. Database Audit (Prisma)
- **Deprecated Models**: `activitylog` and `auditlog` are marked as deprecated in favor of `audit_log`. These should be removed after ensuring data migration.
- **Duplicate Relationship Logic**: `payout` vs `vendor_payout` models.
- **Reserved Keyword Usage**: `Renamedpackage` is used because `package` is reserved. A name like `ServicePackage` would be more idiomatic.
- **Identical Enums**: `booking_status` and `bookingstatuslog_status` are duplicate definitions of the same states.
- **Missing Indexes**: While some indexes exist, complex queries on `booking` (joining `vendorprofile`, `customerprofile`, `bookingitem`) might benefit from more composite indexes.

## 8. Frontend Audit
- **Admin Dashboard**: Exists in `src/app/admin`. Uses a `DashboardShell`. Logic is primarily server-side fetched.
- **Customer/Vendor Apps**: Good separation in `src/app/customer` and `src/app/vendor`.

## 9. Authentication Audit
- **Fragmented Logic**: Auth logic is spread across `auth.ts`, `auth-core.ts`, `auth-edge.ts`, and `admin-auth.ts`.
- **Middleware Complexity**: The middleware handles a lot of concerns including Redis-based session invalidation and complex vendor status redirects. This is powerful but increases the risk of performance bottlenecks (though "Fail OPEN" is implemented).

## 10. Performance Audit
- **Waterfall Potential**: In `/api/cart/route.ts`, multiple sequential lookups are done for Profile -> Cart -> Services/Packages. Some are parallelized, but the initial profile/cart check is sequential.
- **React Query**: Widely used, but cache keys and invalidation logic should be audited for consistency.
- **Image Optimization**: `next/image` is used in some places (e.g., `MainNavbar`), but `VendorCard.tsx` and others should be verified.

## 11. Security Audit
- **Role-Based Access**: Implemented in Middleware and checked again in some routes. However, some routes (like the cart DELETE) don't explicitly check if the `itemId` belongs to the user's cart (though it's scoped by `customerProfileId` in the find).
- **Sensitive Data**: The `Booking` GET route hides location details until event day for vendors, which is a good production practice.

## 12. Build Audit
- **Next.js 15**: Modern stack.
- **Dependencies**: Uses `socket.io`, `bullmq`, `inngest`, `meilisearch`. This is a heavy stack that requires careful orchestration.

---

## AUDIT OUTPUT SUMMARY

| Problem Found | Root Cause | Severity | Recommended Fix |
| :--- | :--- | :--- | :--- |
| Duplicate Booking API | Parallel development of customer/vendor features | High | Merge into a single `/api/bookings/[id]` with role-based field filtering. |
| Duplicate `BookingTimeline` | Lack of component reusability check | Medium | Standardize on the version in `src/components/booking/timeline/`. |
| Deprecated Models in DB | Incomplete migration to `audit_log` | Low | Migrate data and remove `activitylog` and `auditlog`. |
| Fragmented Auth Logic | Iterative implementation of edge/server/admin auth | Medium | Consolidate into a unified auth library with clear edge/server splits. |
| Hardcoded Pagination | Quick implementation for MVP | Medium | Implement standard cursor-based pagination across all list APIs. |

**Rollback Plan**: All cleanup and merge operations will be done by creating new unified versions first, then switching references, and finally deleting old files.

---
**Wait for approval. Do NOT modify code.**
