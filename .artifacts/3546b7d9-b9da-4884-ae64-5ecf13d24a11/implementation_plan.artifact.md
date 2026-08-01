# Implementation Plan - Checkout Flow & API Stability Fix

This plan addresses the broken end-to-end checkout flow, authentication inconsistencies, and API errors without modifying the existing UI design.

## User Review Required

> [!IMPORTANT]
> - **Unified Authentication**: I am introducing `getServerSession` to standardize token extraction across all API routes. This fixes 401 errors caused by missing Authorization headers when cookies are present.
> - **Checkout Role Expansion**: Vendors will now be permitted to perform checkouts (previously restricted to Customers), preventing 403 Forbidden errors during testing.
> - **Socket.IO Stability**: Improvements to `server.ts` will ensure environment variables are correctly loaded for JWT verification.

## Proposed Changes

### 1. Authentication Standardisation
#### [NEW] [auth-server.ts](file:///C:/ReactProjects/ManaEventWebApp/src/lib/auth-server.ts)
- Created a helper to extract tokens from headers OR cookies.

#### [MODIFY] [notifications/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/notifications/route.ts)
- Use `getServerSession` to resolve 401 errors.

#### [MODIFY] [merge/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/commerce/merge/route.ts)
- Use `getServerSession` and improve error handling for batch pricing.

### 2. Checkout API Fixes
#### [MODIFY] [v2/checkout/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/v2/checkout/route.ts)
- Expand allowed roles to `["CUSTOMER", "VENDOR"]`.
- Use `getServerSession`.

#### [MODIFY] [razorpay/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/checkout/razorpay/route.ts)
- Use `getServerSession`.

### 3. Frontend logic
#### [MODIFY] [checkout/page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/customer/checkout/page.tsx)
- Ensure the `items` payload is correctly populated for "Buy Now" flows.
- Add diagnostic logging for button state.
- Ensure the Terms checkbox state is robustly managed.

### 4. Real-time Fixes
#### [MODIFY] [server.ts](file:///C:/ReactProjects/ManaEventWebApp/server.ts)
- Ensure `dotenv/config` is at the very top.
- Improve Socket.io auth logging.

## Verification Plan

### Manual Verification
1. **Auth Flow**: Log in and verify `/api/notifications` returns 200 without manual header injection.
2. **Checkout Validation**: Toggle the Terms checkbox; verify the "Pay Now" button responds instantly.
3. **End-to-End**: Complete a "Buy Now" flow to the Razorpay gateway.
4. **Socket.IO**: Verify "Authenticated connection" appears in the server terminal on page load.

### Automated Tests
- `npx tsc` to ensure auth helper types are correct.
