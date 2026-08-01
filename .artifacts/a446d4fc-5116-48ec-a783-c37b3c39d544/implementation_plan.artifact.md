# Premium Event Summary Card & Unified Booking Progress (UI/UX Enhancement)

Redesign the booking experience by introducing a high-fidelity **Event Summary Card** and a unified **Booking Progress** bar across all booking stages, while strictly preserving the main navigation and all backend logic.

## Mandatory Architectural Rules

> [!IMPORTANT]
> **REUSE MAIN NAVBAR**: The existing Home Navbar must remain sticky and unchanged. Do not introduce a new checkout-specific header.
>
> **SINGLE SOURCE OF TRUTH**: Both new components will read exclusively from the `checkoutStore`.
>
> **STICKY PROGRESS**: The `BookingProgress` component will become sticky below the main navbar upon scrolling. The `EventSummary` card remains normal page content.

## Proposed Changes

### [Store Extension]

#### [MODIFY] [checkoutStore.ts](file:///C:/ReactProjects/ManaEventWebApp/src/store/checkoutStore.ts)
- Extend `CheckoutState` with:
    - `serviceImage: string | null`
    - `serviceName: string | null`
    - `vendorName: string | null`
    - `status: 'DRAFT' | 'IN_PROGRESS' | 'READY_FOR_PAYMENT' | 'CONFIRMED'`
- Ensure `setVendorInfo` populates these metadata fields.
- Update `fetchServerPricing` to ensure `pricing.total` updates the store's `estimatedTotal` logic if applicable.

### [UI Components]

#### [NEW] [EventSummary.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/booking/EventSummary.tsx)
- One reusable component placed directly below the Navbar.
- **Left**: 80x80 Next.js Image (Service/Package thumbnail).
- **Center**: Dynamic details (Service, Vendor, Package, Date, Time, Guests, Location).
- **Right**: Large **Live Estimated Total** and a color-coded **Status Badge**.
- Fully responsive (stacked on mobile).

#### [NEW] [BookingProgress.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/booking/BookingProgress.tsx)
- One reusable component accepting `currentStep`.
- Shared progress UI for steps 1-7.
- **Sticky Behavior**: Becomes sticky below the Navbar when scrolling.

### [Page Integration]

#### [MODIFY] Booking Pages
- Refactor the following pages to include the new components:
    - [details/page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/customer/booking/details/page.tsx)
    - [addons/page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/customer/booking/addons/page.tsx)
    - [review/page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/customer/booking/review/page.tsx)
    - [checkout/page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/customer/checkout/page.tsx)
- Remove existing custom headers and local progress bars.

### [Branding & Polish]
- Colors: Mana Events Purple (`#6D28D9`), Gold (`#D4A017`).
- Animations: Use `framer-motion` for subtle transitions on value changes (pricing, status).
- Radius: `16px`, Shadow: Soft.

## Verification Plan

### Automated Tests
- `npx tsc --noEmit`
- `npm run lint`

### Manual Verification
- **Navbar**: Confirm existing Navbar remains sticky and functional.
- **Dynamic Updates**: Verify that changing guests, packages, or add-ons updates the `EventSummary` total instantly.
- **Status Badge**: Confirm transition from `Draft` to `In Progress` to `Ready for Payment`.
- **Sticky Progress**: Verify the progress bar sticks correctly below the navbar.
- **Responsiveness**: Verify layouts on Desktop, Tablet, and Mobile.
