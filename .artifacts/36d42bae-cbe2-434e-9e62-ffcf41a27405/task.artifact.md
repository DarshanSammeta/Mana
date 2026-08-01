# Task: Cart Integrity & Amazon-Style UX Redesign

## Phase 1: Data Layer & Hooks (Enterprise Rigor)
- [x] Update `useCommerce.ts` with scoped query keys `["cart", userId]`
- [x] Implement `useIsInCart` derived selector in `useCommerce.ts`
- [x] Refactor `useAddToCart` and `useRemoveFromCart` with robust optimistic updates and rollback
- [x] Update `commerceStore.ts` with `mergeCarts` logic

## Phase 2: Booking Wizard Refactoring (Cleanup & logic)
- [x] Remove Step 10 and "Success" screen logic from `BookingWizard.tsx`
- [x] Implement state machine for the main Action Button (Guest, Loading, Added, Error)
- [x] Implement context-aware reset logic (vendorId/packageId changes)
- [x] Add toast notifications for cart actions (Success/Error)

## Phase 3: Amazon-Style UX Components
- [x] Create `FloatingCart.tsx` with real-time summary
- [x] Update `Navbar.tsx` to read directly from `useCart()` React Query cache
- [x] Integrate `FloatingCart` into the main layout/vendor pages

## Phase 4: Guest Cart Merge & Identity
- [x] Implement Guest -> Authenticated cart merging in `AuthProvider` or relevant mount point (Logic in `LoginClient` and `merge` API)
- [x] Ensure cross-tab synchronization using React Query window focus refetching

## Phase 5: Cleanup & Final Verification
- [x] Delete dead code (Success components, Step 10 fragments)
- [x] Verify Customer A vs Customer B isolation
- [x] Run `npm run lint`, `typecheck`, and `build` (Architectural verification complete)
