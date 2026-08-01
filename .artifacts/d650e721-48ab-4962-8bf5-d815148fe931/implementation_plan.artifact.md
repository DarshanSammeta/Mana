# Implementation Plan - Fix Pricing Calculation (500) and Optimization

This plan addresses the critical 500 error in checkout pricing and optimizes the fetch logic to prevent timeouts and redundant calls.

## Diagnosis

### 1. Pricing Bug (500 Error)
In `pricingService.ts`, the `calculateBookingPrice` method has a logic error in its addon filtering:
```typescript
const activeAddons = (pkg.package_addon as any[]).filter(a =>
  a.isActive && (addonIds.length === 0 || addonIds.includes(a.id))
);
```
When `addonIds` is empty (no addons selected), it returns **all** active addons. This causes inflated prices and potentially downstream errors in multi-item checkout if the data shape is unexpected.

### 2. Timeouts and Overload
The `fetchServerPricing` action in `checkoutStore.ts` is triggered on every change (guest count, package selection, addons) without any debouncing. During rapid user input or HMR-triggered state resets, this causes a "request storm" that overwhelms the local database and trips the 10s axios timeout (or the observed ~3s cancellation).

## User Review Required

> [!IMPORTANT]
> I am implementing a **1000ms debounce** on the server-side pricing fetch. This means the price won't update instantly as you type, but only after you stop typing for 1 second. This is a standard optimization for checkout flows to prevent server overload.

## Proposed Changes

### Pricing Logic

#### [MODIFY] [pricing.service.ts](file:///C:/ReactProjects/ManaEventWebApp/src/services/server/pricing.service.ts)
- Fix the `activeAddons` filter condition. If `addonIds` is provided (even if empty), it should strictly match those IDs.
- Logic: `a.isActive && addonIds.includes(a.id)`.

### Checkout Store Optimization

#### [MODIFY] [checkoutStore.ts](file:///C:/ReactProjects/ManaEventWebApp/src/store/checkoutStore.ts)
- Add a `pendingPricingRequest` ref (or use a simple timeout variable) to implement debouncing within the `fetchServerPricing` action.
- Ensure that in-flight requests are aborted (using `AbortController`) if a new request is triggered. This will solve the "cancellation" confusion in the logs.

### API Error Handling

#### [MODIFY] [route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/bookings/calculate/route.ts)
- Improve the error logging to include the full stack trace for 500 errors to help diagnose any future "Critical Errors".

## Verification Plan

### Manual Verification
- **Test No Addons**: Select a package with no addons and verify the price correctly excludes all addons.
- **Test Debounce**: Rapidly change the guest count and verify that only ONE network request is fired after you stop.
- **Test Abort**: Verify that if a request is in progress and a new one starts, the previous one shows as `(canceled)` in the Network tab (intended behavior) but doesn't crash the store.
