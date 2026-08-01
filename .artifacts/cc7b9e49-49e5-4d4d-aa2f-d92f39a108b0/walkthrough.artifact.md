# Walkthrough - React Duplicate Key Warning Fixes

I have resolved the React duplicate key warnings in the `BookingCalendarWidget` and performed a project-wide audit to prevent similar issues in other components.

## Changes Made

### 1. Vendor Components
- **[BookingCalendarWidget.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/vendor/BookingCalendarWidget.tsx)**: Fixed the duplicate key issue in the weekday header. Previously, it used day letters (`S`, `M`, `T`, etc.) as keys, which caused duplicates for Sunday/Saturday and Tuesday/Thursday. I updated it to use a composite key `${d}-${idx}`.
- **[BookingDetailsClient.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/vendor/bookings/[id]/BookingDetailsClient.tsx)**: Updated the event team list to use `member.id` instead of the loop index.

### 2. Customer Components
- **[BookingDetailsPage (Customer)](file:///C:/ReactProjects/ManaEventWebApp/src/app/customer/bookings/[id]/page.tsx)**:
    - Updated the negotiation timeline to use `quote.id` as the key.
    - Updated the service items list to use `item.id` as the key.

### 3. Shared & Home Components
- **[CategoryGrid.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/home/sections/CategoryGrid.tsx)**: Updated category cards and items to use titles and names as keys instead of indices for better stability.
- **[VerificationStatusPage.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/vendor/VerificationStatusPage.tsx)**: Updated the onboarding steps progress tracker to use `step.name` as the key.

## Root Cause
React uses the `key` prop to identify which items in a list have changed, been added, or been removed. Keys must be unique among siblings. Using non-unique values (like day letters "S" or "T") or using indices in dynamic lists can lead to rendering bugs and performance issues.

## Why the new keys are stable
- **Composite Keys**: For static arrays like weekdays, `${letter}-${index}` ensures uniqueness while remaining deterministic.
- **Database IDs**: For dynamic data (bookings, quotes, team members), using the unique database `id` is the most stable and performant approach.
- **Unique Strings**: For configuration-driven lists (categories, steps), using the unique name/title is safe as long as the underlying data model ensures uniqueness.

## Verification
- Verified the fix in `BookingCalendarWidget.tsx` by inspecting the JSX structure.
- Audited over 20 files for similar patterns using `grep`.
- Confirmed that skeleton components correctly use indices as keys since they are static placeholders without unique identity.
