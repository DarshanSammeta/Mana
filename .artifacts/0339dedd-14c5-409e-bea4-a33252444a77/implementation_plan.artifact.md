# Implementation Plan - Fix Vendor Bookings Runtime Error (Step 7.1)

Restore the missing `bookingitem` relation in the Vendor Bookings API and implement defensive rendering in the UI, while maintaining the performance optimizations (using `select` instead of `include`).

## User Review Required

> [!IMPORTANT]
> This fix restores specific fields in the Prisma `select` query for the `/vendor/bookings/recent` API. It also adds safety wrappers to all collection iterations in the Vendor Bookings page to prevent future crashes if relations are missing.

## Proposed Changes

### [API]

#### [MODIFY] [recent/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/vendor/bookings/recent/route.ts)
- Extend the `select` block to include:
    - `user.mobileNumber`
    - `bookingitem` with `id` and `service.title`
- This ensures the UI has the necessary data without fetching the entire relation tree.

### [UI Components]

#### [MODIFY] [page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/vendor/bookings/page.tsx)
- Wrap all collection mappings (e.g., `booking.bookingitem`) with nullish coalescing: `(booking.bookingitem ?? []).map(...)`.
- Audit the file for any other potentially unsafe property accesses (e.g., `booking.user.mobileNumber`).

## Verification Plan

### Automated Tests
- Run `npm run lint` and `npx tsc --noEmit` to verify type safety and ensure zero regressions.
- Run `npm run build` to confirm production build compatibility.

### Manual Verification
1. **API Response Check**: Verify the `/api/vendor/bookings/recent` endpoint returns the expected JSON structure.
2. **UI Rendering**: Confirm the Vendor Bookings page loads correctly and displays service titles and customer phone numbers.
3. **Empty Collections**: Simulate a booking with no items and verify the page does not crash.
