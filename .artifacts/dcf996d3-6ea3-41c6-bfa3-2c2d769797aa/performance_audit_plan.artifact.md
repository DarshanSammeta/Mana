# Performance Audit & Optimization Plan

This plan addresses the identified performance bottlenecks in the Notifications and Auth Refresh APIs, audits database indexing strategies, and resolves issues with Next.js Image assets.

## User Review Required

> [!IMPORTANT]
> - **Database Migrations**: Index changes require `npx prisma db push` or a formal migration. I recommend `db push` for immediate UAT verification.
> - **Image Assets**: Hardcoded Unsplash URLs will be replaced with configurable constants. Ensure that `/public/placeholders/` directory contains necessary fallback images.

## Proposed Changes

### 1. API Performance Optimizations

#### [MODIFY] [Notifications API](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/notifications/route.ts)
- **Problem**: Sequential `await` on `findMany` and `count` causes ~2s latency.
- **Solution**: Use `Promise.all` to parallelize queries.
- **Over-fetching**: Add `select` to fetch only required fields (id, title, message, isRead, createdAt, category, link).

#### [MODIFY] [Auth Refresh API](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/auth/refresh/route.ts)
- **Problem**: Triple DB hits (RefreshToken -> User -> VendorProfile).
- **Solution**: Consolidate into a single `prisma.refreshtoken.findUnique` with nested `include: { user: { include: { vendorprofile: true } } }`.

### 2. Database Indexing Strategy

#### [MODIFY] [Prisma Schema](file:///C:/ReactProjects/ManaEventWebApp/prisma/schema.prisma)
Add the following performance indexes:
- `notification`: `@@index([userId, isRead, createdAt])` - Optimized for "Fetch last 20 unread".
- `bookingassignment`: `@@index([vendorId, status])` and `@@index([bookingId, status])`.
- `service`: `@@index([vendorProfileId, basePrice])` - Optimized for marketplace filtering.
- `review`: `@@index([vendorId, rating])`.

### 3. Next.js Image & Asset Audit

#### [MODIFY] [Hero Constants](file:///C:/ReactProjects/ManaEventWebApp/src/constants/assets.ts)
- Replace Unsplash URLs in `HERO_SLIDES` and `IMAGES.DEFAULT_EVENT` with local placeholders (e.g., `/images/hero/wedding.jpg`) or configurable Cloudinary IDs.

#### [MODIFY] [Cloudinary Fallbacks](file:///C:/ReactProjects/ManaEventWebApp/src/config/cloudinary.ts)
- Update `IMAGE_FALLBACKS` to use local assets from `/public/placeholders/` instead of external Unsplash links to prevent 404s and reduce external DNS lookups.

### 4. Prisma Query Audit (Over-fetching)

#### [MODIFY] [Auth Me API](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/auth/me/route.ts)
- Use top-level `select` instead of `include` to avoid fetching sensitive or unused fields (like `password`, `otp`).

## Verification Plan

### Automated Tests
- `npm run build`: Verify no regressions in type safety.
- `npx prisma validate`: Confirm index syntax.
- Time-to-First-Byte (TTFB) measurement using `curl -w` for `/api/notifications`.

### Manual Verification
- **Login/Refresh Flow**: Verify session persists after token expiry.
- **Notifications**: Check unread count updates correctly in UI.
- **Image Check**: Audit Network tab in Chrome DevTools to ensure no 404s on images.
