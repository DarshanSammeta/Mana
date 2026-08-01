# Task: Marketplace TypeError Final Resolution

Resolve the `Cannot read properties of undefined (reading 'vendor')` error by fixing the source of the invalid `services` array.

## Todo List

- [x] **1. Robust Client Transformation**
    - [x] Refactor `services` useMemo in `MarketplaceClient.tsx` to use a strict `reduce` with type and property checks.
- [x] **2. API DTO Hardening**
    - [x] Update `app/api/marketplace/services/route.ts` mapping to enforce `vendorprofile.id` existence.
- [x] **3. Library Mapping Hardening**
    - [x] Update `lib/marketplace.ts` mapping to match the API route improvements.
- [ ] **4. Verification**
    - [ ] Verify that `services` is always a valid array of objects.
    - [ ] Verify that the `vendors` map is created without runtime errors.
