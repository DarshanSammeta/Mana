# Full Codebase & Dead Code Audit Report (Phase 2)

This report expands the audit to Hooks, Utils, and UI Components, identifying dead code and redundant logic.

## [DEAD] - High Confidence Candidates
*The following items have zero external code-level references and are safe to delete.*

### Hooks (`src/hooks`)
1.  **[DEAD] [useSubscription.ts](file:///C:/ReactProjects/ManaEventWebApp/src/hooks/useSubscription.ts)**: Entire file has zero external callers.
2.  **[DEAD] [use-marketing.ts](file:///C:/ReactProjects/ManaEventWebApp/src/hooks/use-marketing.ts)**: Entire file has zero external callers.
3.  **[DEAD] [use-operations.ts](file:///C:/ReactProjects/ManaEventWebApp/src/hooks/use-operations.ts)** (Partial): `useCreateTicket`, `useDisputes`, `useRaiseDispute`, `useResolveDispute`, `useCancelBooking` are unused.
4.  **[DEAD] [use-finance.ts](file:///C:/ReactProjects/ManaEventWebApp/src/hooks/use-finance.ts)** (Partial): `useVendorSettlements`, `useTransactions`, `useRequestRefund` are unused.
5.  **[DEAD] [use-customer-experience.ts](file:///C:/ReactProjects/ManaEventWebApp/src/hooks/use-customer-experience.ts)** (Partial): `useSavedSearches` is unused (app uses `useSavedSearchesStore`).

### Components (`src/components`)
1.  **[DEAD] [Testimonials.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/home/Testimonials.tsx)**: Not imported in `HomeClient` or any other page.
2.  **[DEAD] [Recommendations.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/Recommendations.tsx)**: Replaced by `RecommendationCarouselSection`.
3.  **[DEAD] [NearbyVendors.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/NearbyVendors.tsx)**: Zero usages.
4.  **[DEAD] [SearchBar.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/SearchBar.tsx)**: Zero usages (app uses `SearchInput` or integrated search logic).
5.  **[DEAD] [CategoryCard.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/CategoryCard.tsx)**: Zero usages.

### Utilities & Logic
1.  **[DEAD] [calculation.ts](file:///C:/ReactProjects/ManaEventWebApp/src/utils/calculation.ts)**: Pricing logic moved to server-side `PricingService`.
2.  **[DEAD] `lib/utils.ts` Helpers**: `formatNumber`, `formatPercentage`, `formatTime`, `formatPhone`, `slugify`.
3.  **[DEAD] `GET /api/bookings`**: The generic list/fetch-by-ID endpoint in `app/api/bookings/route.ts` has zero production callers (replaced by role-scoped routes).

---

## [REDUNDANT] - Unification Candidates

### 1. [REDUNDANT] `useWishlist` Hook
- **Files**: `hooks/useCommerce.ts` vs `hooks/use-customer-experience.ts`.
- **Plan**: Standardize on `useCommerce.ts` version (which syncs with Zustand) and delete the experience one.

### 2. [REDUNDANT] Date Formatting
- **Functions**: `formatDate` (Legacy in `utils.ts`) vs `formatSafe` (New in `utils/date.ts`).
- **Plan**: Migrate one remaining caller in `bookings/page.tsx` to `formatSafe` and delete legacy helper.

### 3. [REDUNDANT] Notification System
- **Files**: `lib/notifications.ts` vs `lib/notifications/vendor.ts`.
- **Plan**: Merge `VendorNotifications` into the centralized `NotificationManager` in `notifications.ts`.

---

## [ARCHIVE] - Manual Scripts (Updated)
Moving to `scripts/archive/`:
- All existing candidates from Phase 1.
- `scripts/redis-bench.ts`
- `scripts/socket-stress.ts`
- `scripts/verify-marketplace.ts`

---

## Next Steps
1.  **Notification Unification**: Prepare unified diff for `NotificationManager`.
2.  **Hook Cleanup**: Prepare batch deletion for dead hooks/functions.
3.  **Execution**: Apply changes after git checkpoint.
