# Implementation Plan - Redesign Event Categories UI to Premium Dynamic Image-Cards

This plan refactors the `CategoryIcons.tsx` component to provide a high-end, database-driven "Event Categories" section on the homepage. The redesign follows the premium specification (16:9 cards, rounded 24px, gradient overlays) and ensures 100% dynamic behavior based on the Prisma `eventtype` model.

## User Review Required

> [!IMPORTANT]
> - **Zero Hardcoding**: All images and names are derived from the `eventtype` table. New event types added by the Admin will appear automatically.
> - **Marketplace Integrity**: Clicking a card will use the existing `/marketplace?eventTypeId={id}` route, which already correctly filters vendors based on the relationship chain: `EventType` → `Category` → `Subcategory` → `ServiceType` → `Service` → `Vendor`.
> - **Home Page Integration**: I will explicitly add the `CategoryIcons` component to `src/app/(public)/page.tsx` as it is currently omitted from the rendering tree.

## Proposed Changes

### [Home-Component]

#### [MODIFY] [CategoryIcons.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/home/sections/CategoryIcons.tsx)
- Rewrite the JSX to implement the premium card design:
    - **Grid**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`.
    - **Card**: `relative aspect-video rounded-[24px] overflow-hidden group shadow-lg`.
    - **Image**: Use `next/image` with `fill`, `object-cover`, and `optimizeImage(type.image, 'card')`.
    - **Overlay**: `absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent`.
    - **Typography**: `absolute bottom-6 left-6 text-white font-bold text-xl md:text-2xl tracking-tight`.
    - **Interactions**: `group-hover:scale-105 transition-transform duration-300` on the image.
- Preserve the `eventTypes` prop and routing logic.

#### [MODIFY] [page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/(public)/page.tsx)
- Import `CategoryIcons` from `@/components/home/sections/CategoryIcons`.
- Render `<CategoryIcons eventTypes={serializableEventTypes} />` between `HomeClient` and `FeaturedVendors`.

## Verification Plan

### Automated Tests
- Verify `optimizeImage` handles null/missing DB images with the standard placeholder.
- Check that the `Link` component uses the correct dynamic `type.id`.

### Manual Verification
- Verify the 16:9 aspect ratio and 24px rounding.
- Ensure the hover animation and gradient legibility match the Zomato-style inspiration.
- Confirm that clicking a card (e.g., Wedding) loads the marketplace with the correct `eventTypeId` and filters the vendor list accordingly.
