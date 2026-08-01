# Implementation Plan: Marketplace Service Card Redesign (Amazon-style)

Redesign the Marketplace Service Cards to match the Amazon-style UI requirements for Mana Events.

## User Review Required

> [!IMPORTANT]
> **Action Buttons**: The "View Details" button will be removed. The entire card will be clickable to view details, while the "Book Now" button will directly initiate the booking flow.

> [!NOTE]
> **Responsive Layout**: The grid will be updated to show 5 cards on desktop, 3 on tablet, and 2 on mobile to match the required density.

## Proposed Changes

### 1. UI Components Redesign

#### [MODIFY] [ProductCard.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/ProductCard.tsx)
- Change image aspect ratio to **16:9**.
- Implement hover zoom and lift effects.
- Dynamic badges positioned at top-left.
- Update typography: Vendor Name (small gray), Service Title (max 2 lines).
- Amazon-style rating and price section (original price, discount %, current price).
- Footer buttons: Wishlist (Secondary) and **Book Now (Primary #6D28D9)**.

#### [MODIFY] [ProductGrid.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/ProductGrid.tsx)
- Update grid classes for responsive columns: `grid-cols-2 sm:grid-cols-3 xl:grid-cols-5`.

#### [MODIFY] [ProductSkeleton.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/ProductSkeleton.tsx)
- Update skeleton to match the new 16:9 aspect ratio and 2-button layout.

## Verification Plan

### Manual Verification
- **Visual Audit**: Compare the card design against the Amazon-style requirements (colors, spacing, typography).
- **Responsive Test**: Verify column counts across breakpoints (Mobile: 2, Tablet: 3, Desktop: 5).
- **Interactive Test**: Verify hover animations (lift, shadow, zoom) and click actions (card click vs button click).
