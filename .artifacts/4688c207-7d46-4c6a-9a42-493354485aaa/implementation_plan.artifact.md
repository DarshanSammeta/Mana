# Implementation Plan - Fix BookingWizard selectedAddonIds Runtime Error

Address the `TypeError: Cannot read properties of undefined (reading 'length')` by hardening the `checkoutStore` and defensive programming in UI components.

## User Review Required

> [!IMPORTANT]
> **State Integrity**: The fix ensures that `selectedAddonIds` is always an array, even if the local storage contains legacy state without this field.
> **Defensive Coding**: Standardizing on optional chaining and nullish coalescing for all array accesses in the booking flow.

## Proposed Changes

### [1. checkoutStore Hardening]

#### [MODIFY] [checkoutStore.ts](file:///C:/ReactProjects/ManaEventWebApp/src/store/checkoutStore.ts)
- Update `toggleAddon` to handle potentially undefined `selectedAddonIds` by using `get().selection.selectedAddonIds || []`.
- Update `fetchServerPricing` to default to `[]` for `addonIds`.
- Add a custom `merge` function to the `persist` middleware to ensure `selectedAddonIds` is initialized to `[]` if missing during hydration.

### [2. BookingWizard UI Polish]

#### [MODIFY] [BookingWizard.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/booking/BookingWizard.tsx)
- Safely access `selectedAddonIds.length` using optional chaining and nullish coalescing: `(selection.selectedAddonIds?.length || 0)`.
- Update array methods like `.includes()` to be defensive.

### [3. Global Audit]
- Audit other components identified in `grep` (`VendorCard.tsx`, `MarketplaceClient.tsx`, etc.) to ensure no other unsafe `.length` calls exist on `selectedAddonIds`.

## Verification Plan

### Automated Tests
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

### Manual Verification
1. **Legacy State Simulation**: Manually edit `localStorage` to remove `selectedAddonIds` from `mana-checkout-storage` and refresh the page. Verify no crash occurs.
2. **Add-on Toggle**: Select and deselect add-ons in the Wizard. Verify the Order Summary updates correctly.
3. **Reset**: Click "View My Bookings" (which triggers reset) and verify state is cleared to defaults.
