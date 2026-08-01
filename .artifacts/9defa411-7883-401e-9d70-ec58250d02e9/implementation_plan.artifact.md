# Implementation Plan - Marketplace UI Final Refinements

This plan details the final refinements to the Marketplace UI, focusing on icon standardization, brand-consistent CTA styling, and interaction improvements.

## User Review Required

> [!IMPORTANT]
> **Emoji Removal**: All emoji icons (like 🛒) have been removed from the Marketplace UI and replaced with standard Lucide React icons (e.g., `ShoppingCart`) for a more professional, enterprise-grade appearance.
>
> **Brand-Centric Primary CTA**: The "Add to Cart" button now exclusively uses the Mana Events brand purple (`#6D28D9`) with a consistent 12px radius, moving away from temporary Amazon-yellow experiments.

## Proposed Changes

### [Marketplace Components]

#### [MODIFY] [ProductCard.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/ProductCard.tsx)
- **Icon Update**: Replaced `🛒` emoji with Lucide `ShoppingCart` icon (size 18).
- **Button Styling**:
    - Applied brand purple (`#6D28D9`) with hover (`#5B21B6`) and active (`#4C1D95`) states.
    - Set height to 44px, radius to 12px.
    - Added a subtle lift and soft purple shadow on hover.
- **Card Interaction**:
    - Wrapped entire card content in an absolute background `Link` for full-card clickability.
    - Ensured `pointer-events-none` on content to let the background link work, while keeping `pointer-events-auto` on the CTA button.
    - Maintained `stopPropagation` on the button to prevent navigation when adding to cart.
- **Standardized Icons**: Used `BadgeCheck` for verified status and `Zap` for availability.

#### [MODIFY] [VendorCard.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/VendorCard.tsx)
- **Standardized Icons**: Replaced `ShieldCheck` with `BadgeCheck` to align with the marketplace-wide icon set.

## Verification Plan

### Manual Verification
- **Card Clickability**: Click on the card image, title, or whitespace. Verify it navigates to `/marketplace/service/[slug]-[id]`.
- **Button Interaction**: Click "Add to Cart". Verify it adds the item without navigating away.
- **Icon Consistency**: Verify no emojis appear in the `ProductCard`. Ensure `ShoppingCart` icon is correctly aligned and sized in the button.
- **Hover States**: Verify the card "lifts" and the button has a soft purple glow on hover.
