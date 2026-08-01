# Implementation Plan - Final Two-Tier Navigation Refinement

Refactor the navigation architecture into exactly two static rows: a minimalist, role-based Main Navbar (Purple) and a discovery-focused Sub Navbar (White).

## User Review Required

> [!IMPORTANT]
> - **Main Navbar (Purple)**: Will contain ONLY Logo, Location, Search, Vendor Dashboard (Vendor only), Orders (Auth only), Notifications (Auth only), User Account, and Cart.
> - **Sub Navbar (White)**: Will contain Categories on the left (with a "More" dropdown) and Quick Links on the right.
> - **Static Only**: No database fetching or dynamic width calculations.
> - **Zero Duplication**: Categories and Quick Links will be strictly separated.

## Proposed Changes

### Configuration (`src/config/navigation/`)

#### [MODIFY] [categories.ts](file:///C:/ReactProjects/ManaEventWebApp/src/config/navigation/categories.ts)
- Maintain `visibleCategories` (8 items) and `moreCategories` (10 items) lists exactly as specified.

#### [MODIFY] [subNavigation.ts](file:///C:/ReactProjects/ManaEventWebApp/src/config/navigation/subNavigation.ts)
- Maintain `quickLinks` (Near Me, Offers, Popular, Recently Added).

#### [DELETE] [mainNavigation.ts](file:///C:/ReactProjects/ManaEventWebApp/src/config/navigation/mainNavigation.ts)
- Remove as primary links are now handled by role-based logic or moved to the Sub Navbar.

### Components (`src/components/navigation/`)

#### [MODIFY] [MainNavbar.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/navigation/MainNavbar.tsx)
- Reorder and conditionally render items:
    1.  **Logo**
    2.  **Location Selector**
    3.  **Search Bar**
    4.  **Vendor Dashboard** (Vendor role only)
    5.  **Orders** (Auth only)
    6.  **Notifications** (Auth only)
    7.  **User Account**
    8.  **Cart**
- Remove all static links (Home, Marketplace, etc.).

#### [MODIFY] [SubNavbar.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/navigation/SubNavbar.tsx)
- Ensure exact layout:
    - Left: "All Events", visible categories, "More" dropdown.
    - Right: Quick Links.
- No dynamic width or ResizeObserver.

#### [MODIFY] [MoreDropdown.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/navigation/MoreDropdown.tsx)
- Strictly for overflow categories.

### Core

#### [MODIFY] [Navbar.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/common/Navbar.tsx)
- Orchestrate `MainNavbar` and `SubNavbar`.
- Remove legacy logic and static link mapping.

## Verification Plan

### Automated Tests
- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Run `npm run build`.
- All must pass with **0 errors**.

### Manual Verification
1.  **Guest Role**: Verify Logo, Location, Search, Account, Cart.
2.  **Customer Role**: Verify Logo, Location, Search, Orders, Notifications, Account, Cart.
3.  **Vendor Role**: Verify all items including Vendor Dashboard.
4.  **Sub Navbar**: Verify categories on left, quick links on right, "More" dropdown content.
5.  **Responsiveness**: Verify the two-row layout and mobile menu (all links should be accessible).
6.  **Functionality**: Verify search, location, and authentication features still work perfectly.
