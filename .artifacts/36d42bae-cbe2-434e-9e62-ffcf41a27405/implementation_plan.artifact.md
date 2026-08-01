# Implementation Plan - Cart Integrity & Amazon-Style UX Redesign

This plan addresses the critical cart validation bug and aligns the marketplace experience with enterprise standards (Amazon/Flipkart). It ensures the backend is the only source of truth for cart state.

## User Review Required

> [!IMPORTANT]
> **Single Source of Truth**: We are decoupling the checkout wizard from cart logic. The "Added ✓" state will now be derived strictly from React Query data (`["cart", userId]`).
> **Zero-Interruption UX**: The full-screen "Added to Cart" success page (Step 10) is being deleted. Users will stay on the vendor page after adding a service.
> **Guest Cart Merge**: We will implement intelligent merging of the local guest cart into the authenticated user cart upon login, preventing duplicates by comparing `vendorId`, `packageId`, and `variantId`.

## Proposed Changes

### 1. Data Layer & Resilience

#### [MODIFY] [useCommerce.ts](file:///C:/ReactProjects/ManaEventWebApp/src/hooks/useCommerce.ts)
- **Scoped Query Keys**: Update to `["cart", userId || "guest"]`.
- **Derived Selector**: Implement `useIsInCart(vendorId, packageId)` hook.
- **Optimistic UI**: Enhance `useAddToCart` to immediately update badge and button states with automatic rollback.
- **Error Handling**: Explicit "Retry" states for failed cart fetches.

#### [MODIFY] [commerceStore.ts](file:///C:/ReactProjects/ManaEventWebApp/src/store/commerceStore.ts)
- Add `mergeCarts` action to handle guest -> user transition.

### 2. UI Components

#### [MODIFY] [BookingWizard.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/booking/BookingWizard.tsx)
- **Delete Step 10**: Remove the success step and all associated logic.
- **Unified Action Button**: Implement a state machine for the main button:
  - `GUEST`: "Login to Add to Cart"
  - `LOADING`: Spinner
  - `IN_CART`: "Added ✓ | View Cart"
  - `ERROR`: "Retry Add to Cart"
  - `DEFAULT`: "Add to Shopping Cart"
- **Context-Aware Reset**: Ensure wizard configuration resets only when `vendorId` or `packageId` changes.

#### [NEW] [FloatingCart.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/commerce/FloatingCart.tsx)
- Add a sticky/floating bottom bar that appears when items are in the cart.
- Displays: Item count, Subtotal, Savings, and a "Checkout" action.

#### [MODIFY] [Navbar.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/common/Navbar.tsx)
- Replace local counter with direct subscription to `useCart()` for real-time, cross-tab synchronization.

### 3. Cleanup & Migration

#### [DELETE] Standalone Success Components
- Remove `AddedToCartSuccess.tsx` (if exists).
- Remove Step 10 from all wizard definitions.
- Clean up unused Zustand flags like `isSuccess`.

## Verification Plan

### Technical Checks
- [ ] `npm run build` & `typecheck` to ensure no regressions.
- [ ] Verify `localStorage` is cleared correctly on logout to prevent state bleed.

### Business Scenarios
1. **Multi-Vendor Isolation**: Add from Vendor A. Verify Vendor B correctly shows "Add to Cart" (not "Added").
2. **Guest Merge**: Add items as guest -> Login. Verify items exist in the user's dashboard cart.
3. **Cross-Tab Sync**: Add item in Tab A. Verify Tab B badge updates without refresh.
4. **Optimistic Rollback**: Turn off Wi-Fi -> Click "Add to Cart". Verify UI reverts to "Add to Cart" and shows error toast.

---
**Please approve this final plan to begin implementation.**
