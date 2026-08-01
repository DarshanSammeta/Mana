# Task: Premium Event Summary Card & Unified Booking Progress

## Phase 1: Store Extension
- [ ] Extend `CheckoutState` in `checkoutStore.ts` with metadata and status.
- [ ] Update `setVendorInfo` and `resetCheckout` logic.

## Phase 2: Reusable Components
- [ ] Create `src/components/booking/EventSummary.tsx`.
- [ ] Create `src/components/booking/BookingProgress.tsx`.

## Phase 3: Integration
- [ ] Update `ServicePurchaseBox.tsx` to populate metadata.
- [ ] Refactor booking pages (`details`, `addons`, `review`, `checkout`).
- [ ] Implement sticky logic for `BookingProgress`.

## Phase 4: Final Polish & Verification
- [ ] Add animations for value changes.
- [ ] Verify responsiveness.
- [ ] Run `npx tsc --noEmit` and `npm run lint`.
- [ ] Manual E2E test.
