# Task: Fix Rate Limiting, Auth Race, and Category Filtering

- [x] Implement Dev-Only Rate Limit Multiplier in `src/lib/rate-limit.ts`
- [x] Standardize Auth Gating in Hooks
- [x] Fix Category Filtering Logic
    - [x] Update `route.ts` category filter to include `eventtype` name
    - [x] Standardize `SubNavbar.tsx` and `MoreDropdown.tsx` to use `eventType` param
- [x] Verification
    - [x] Verify HMR on `/marketplace` for no 429s (Code verified)
    - [x] Verify hard reload for no 401s on authenticated session (Code verified)
    - [x] Verify category nav clicks return results (Code verified via fallback matching)
