# Implementation Plan: Critical Bug Fix & UX Refinement

Fix the "Buy Now" button functionality and refine the Checkout sidebar to be more focused and Amazon-style.

## User Review Required

> [!IMPORTANT]
> - **Buy Now Button**: This button was missing an `onClick` handler. It will now add the selected package to the cart and immediately redirect the user to the Checkout page.
> - **Sidebar Cleanup**: The `PaymentTimeline` will be removed from the Checkout sidebar as it's premature. It will be moved to the Booking Success and Booking Details pages.
> - **Focused Checkout**: The Checkout sidebar will now emphasize booking progress and service details.

## Proposed Changes

### 1. Fix "Buy Now" Button

#### [MODIFY] [ServicePurchaseBox.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/ServiceDetails/ServicePurchaseBox.tsx)
- Implement `handleBuyNow` function.
- It will call `addToCart` and, upon success, use `router.push('/customer/checkout')`.
- Attach `handleBuyNow` to the "Buy Now" button.

### 2. Refine Checkout Sidebar

#### [MODIFY] [page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/customer/checkout/page.tsx)
- Remove `PaymentTimeline` from the right sidebar.
- Add a **Booking Progress** indicator (e.g., "Step 2 of 7").
- Display **Selected Service** and **Selected Package** prominently in the sidebar.
- Ensure the **Order Breakdown** is clean and Amazon-style.

### 3. Move Payment Timeline

#### [MODIFY] [page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/customer/orders/success/page.tsx)
- Add `PaymentTimeline` below the booking confirmation card to show the payment lifecycle.

#### [MODIFY] [page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/customer/bookings/%5Bid%5D/page.tsx)
- Add `PaymentTimeline` to the financial summary section to provide transparency on paid/pending amounts.

## Verification Plan

### Manual Verification
1. **Buy Now Test**:
   - Navigate to Service Details.
   - Select a package.
   - Click "Buy Now".
   - **Expected**: Item is added to cart and browser redirects to `/customer/checkout`.
2. **Checkout Sidebar Test**:
   - Verify `PaymentTimeline` is GONE.
   - Verify "Step X of 7" is visible.
   - Verify Service/Package names are visible.
3. **Timeline Visibility**:
   - Complete a booking.
   - Verify `PaymentTimeline` appears on the Success page.
   - Check an existing booking and verify `PaymentTimeline` appears in details.
