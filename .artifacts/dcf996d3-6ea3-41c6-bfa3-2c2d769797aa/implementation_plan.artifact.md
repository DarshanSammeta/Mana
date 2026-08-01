# Performance Optimization Plan

This plan implements production-grade performance enhancements, focusing on API latency reduction, database query optimization, and asset delivery.

## User Review Required

> [!IMPORTANT]
> - **Database Migrations**: New composite indexes will be added to `schema.prisma`. I will use `npx prisma db push` to apply them immediately for verification.
> - **Asset Changes**: Hardcoded Unsplash URLs are being replaced with local placeholders. Ensure `/public/placeholders/` exists.

## Proposed Changes

### Phase 1: Notifications API Optimization
- **Target**: `GET /api/notifications`
- **Changes**:
    - Use `Promise.all` for parallel execution of `findMany` and `count`.
    - Replace `findMany` with `select` to fetch only: `id`, `title`, `message`, `isRead`, `createdAt`, `category`, `link`, `priority`.
    - Add composite index: `@@index([userId, isRead, createdAt])`.

### Phase 2: Auth Refresh Optimization
- **Target**: `POST /api/auth/refresh`
- **Changes**:
    - Consolidate sequential queries into a single nested `prisma.refreshtoken.findUnique` with `select`.
    - Avoid fetching full `user` and `vendorprofile` objects.

### Phase 3: Prisma Query Audit (Over-fetching)
- **Target**: `GET /api/auth/me`, `POST /api/auth/login`, `GET /api/bookings`.
- **Changes**:
    - Replace `include` with `select` to exclude `password`, `otp`, `otpExpiry`, and large JSON snapshots where not needed.
    - Limit relations to required fields (e.g., vendor business name/logo only).

### Phase 4: Database Index Audit
- **Target**: `schema.prisma`
- **New Indexes**:
    - `notification`: `@@index([userId, isRead, createdAt])`
    - `bookingassignment`: `@@index([vendorId, status])`, `@@index([bookingId, status])`
    - `service`: `@@index([vendorProfileId, basePrice])`
    - `booking`: `@@index([customerProfileId, status, createdAt])`
    - `payment`: `@@index([bookingId, status, createdAt])`
    - `audit_log`: `@@index([bookingId, createdAt])`

### Phase 5: Broken Images & Assets
- **Target**: `src/constants/assets.ts`, `src/config/cloudinary.ts`, `HomeClient.tsx`.
- **Changes**:
    - Replace Unsplash URLs with local `/placeholders/` or stable production-ready Cloudinary assets.
    - Fix 404 risks by adding `onError` handlers or using absolute internal paths.

### Phase 6: Redis & unstable_cache
- **Target**: `src/lib/marketplace.ts`, `src/lib/vendor.ts`.
- **Changes**:
    - Implement `unstable_cache` for `getCategoryAveragePrice`.
    - Ensure `revalidateTag` is called on service/package updates to invalidate price caches.

## Verification Plan

### Automated Tests
- `npm run build`: Must pass with 0 errors.
- `npx tsx scripts/bench-notifications.ts`: Custom script to measure TTFB.

### Manual Verification
- **Network Tab Audit**: Verify `/api/notifications` payload size reduction (>50%).
- **Image Audit**: Scroll through Homepage and Marketplace to ensure 0 broken image icons.
- **Login persistence**: Verify refresh token flow still works after optimization.
