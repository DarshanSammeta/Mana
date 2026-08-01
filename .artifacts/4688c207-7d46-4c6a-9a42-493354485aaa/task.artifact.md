# Task - Fix BookingWizard selectedAddonIds Runtime Error

- [ ] **Phase 1: checkoutStore Hardening**
    - [ ] Update `toggleAddon` in `checkoutStore.ts`
    - [ ] Update `fetchServerPricing` in `checkoutStore.ts`
    - [ ] Add persistence merge logic in `checkoutStore.ts`
- [ ] **Phase 2: BookingWizard Defensive Access**
    - [ ] Update `BookingWizard.tsx` summary list
    - [ ] Harden `includes` checks in `BookingWizard.tsx`
- [ ] **Phase 3: Global Verification**
    - [ ] Audit `VendorCard.tsx` and other grep results
    - [ ] Run Lint & TSC Verification
    - [ ] Final Build Verification
