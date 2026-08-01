# Task: Amazon-style Marketplace & Deferred Booking Flow

## Checklist

- [x] **Phase 1: Service Details Redesign**
    - [x] Create `ServiceGallery.tsx` with zoom support
    - [x] Create `ServicePurchaseBox.tsx` (Sticky)
    - [x] Create `PackageDisplayList.tsx`
    - [x] Create `ServiceDetailsClient.tsx` (Main Orchestrator)
    - [x] Update `/marketplace/service/[id]/page.tsx`
- [x] **Phase 2: Cart & State Refactor**
    - [x] Simplify `AddToCart` logic (Verify no booking fields sent)
    - [x] Update `useCommerceStore` for lightweight cart items
    - [x] Decouple `checkoutStore` from Marketplace (Removed wizard from Vendor & Service pages)
- [x] **Phase 3: Checkout & Booking Wizard Migration**
    - [x] Integrate 7-step Booking Wizard into `/customer/checkout/page.tsx`
    - [x] Ensure state hydration from Cart items
- [x] **Phase 4: Cleanup & Verification**
    - [x] Final Manual Pass & Walkthrough

- [x] **Phase 5: Package UX Cleanup**
    - [x] Lift `selectedPackageId` state to `ServiceDetailsClient.tsx`
    - [x] Refactor `ServicePurchaseBox.tsx` into a controlled component
    - [x] Implement `PackageIncludes.tsx` (Dynamic single-package view)
    - [x] Remove `PackageDisplayList.tsx` and legacy card grid
    - [x] Verify dynamic updates and state flow
    - [x] Run `npm run lint` and `npx tsc --noEmit`

- [x] **Phase 6: Critical Bug Fix & Sidebar Refinement**
    - [x] Fix "Buy Now" button handler in `ServicePurchaseBox.tsx`
    - [x] Remove `PaymentTimeline` from Checkout sidebar in `/customer/checkout/page.tsx`
    - [x] Add Progress and Service/Package info to Checkout sidebar
    - [x] Move `PaymentTimeline` to Success and Booking Details pages
    - [x] Final verification of Checkout flow
