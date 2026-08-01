# Implementation Plan - Fix React Duplicate Key Warnings

This plan addresses the React warnings caused by duplicate keys in the project, specifically in the `BookingCalendarWidget` and other identified areas.

## User Review Required

> [!NOTE]
> This change strictly fixes React key warnings without affecting UI, styling, or logic.

## Proposed Changes

### 1. Vendor Components

#### [MODIFY] [BookingCalendarWidget.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/vendor/BookingCalendarWidget.tsx)
- Fix duplicate keys in the weekday headers loop by using `${d}-${idx}` or just `idx` (since the list is static).
- Fixed keys: `["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => <div key={idx}>...</div>)`

### 2. Global Audit & Cleanup

#### [MODIFY] Unsafe Keys in Other Files
I will audit the following files identified by `grep` that use potentially non-unique keys:
- `src/components/marketplace/SearchInput.tsx`: Ensure items in search results use unique identifiers (id) instead of the item value if possible.
- `src/components/marketplace/MarketplaceFilters.tsx`: Check line 154 `key={city}` if multiple entries with same city name could exist.
- `src/components/vendor/VerificationStatusPage.tsx`: Check line 145 `key={doc}`.

## Verification Plan

### Manual Verification
- Open the Vendor Dashboard and verify the console is free of "Encountered two children with the same key" warnings.
- Check the Marketplace search and filters for any similar warnings.

### Automated Tests
- Run `npm run build` or a similar lint/validation command if available to ensure no regressions in JSX structure.
