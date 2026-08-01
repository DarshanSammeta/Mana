# Walkthrough - Fix Vendor Bookings Runtime Error

I have resolved the `TypeError: Cannot read properties of undefined (reading 'map')` in the Vendor Bookings page. This was caused by the omission of the `bookingitem` relation in the optimized API response.

## Changes Made

### API Restored & Optimized

- **[recent/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/vendor/bookings/recent/route.ts)**:
    - Updated the Prisma `select` statement to include `bookingitem`.
    - Selected only the necessary sub-fields (`id`, `service.title`) to maintain performance.
    - Added `user.mobileNumber` to the selection as it is required by the UI.

### Defensive UI Implementation

- **[page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/vendor/bookings/page.tsx)**:
    - Replaced `booking.bookingitem.map` with `(booking.bookingitem ?? []).map` to prevent crashes if the relation is missing.
    - Added optional chaining for customer details (`booking.user?.fullName`, `booking.user?.mobileNumber`).
    - Provided fallbacks for customer data (`"Guest"`, `"N/A"`) and service titles (`"Unknown Service"`).

### Quality Assurance

- **Type Safety**: Fixed an implicit `any` type in `checkoutStore.ts` that was causing `tsc` to fail.
- **Verification**:
    - `npm run lint`: Passed with 0 errors.
    - `npx tsc --noEmit`: Passed with 0 errors.
    - Verified that performance optimizations (using `select` instead of `include`) were preserved.

## Code Comparison (API)

```diff
- user: { select: { fullName: true } }
+ user: { select: { fullName: true, mobileNumber: true } },
+ bookingitem: {
+   select: {
+     id: true,
+     service: { select: { title: true } }
+   }
+ }
```

> [!NOTE]
> No UI design, styling, or business logic was changed. The fix strictly addresses the data contract regression and UI resilience.
