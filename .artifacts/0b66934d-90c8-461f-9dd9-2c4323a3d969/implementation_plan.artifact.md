# Refactor Service Routing to ID-based (Option A)

This plan implements ID-based routing for service detail pages to eliminate fragile slug-parsing logic and ensure agnosticism toward ID formats (CUID, UUID, etc.).

## User Review Required

> [!IMPORTANT]
> The URLs will change from `/marketplace/service/[slug]-[id]` to `/marketplace/service/[id]`. This simplifies the logic but removes the human-readable slug from the URL for now.

## Proposed Changes

### Routing & App Structure

#### [NEW] [service/[id]/page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/(public)/marketplace/service/[id]/page.tsx)
*   Rename directory from `[slug]` to `[id]`.
*   Simplify `getServiceData` to use `id` directly from `params` without any splitting or regex.
*   Update `generateMetadata` and `ServiceDetailPage` to use `resolvedParams.id`.

#### [DELETE] [service/[slug]/page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/(public)/marketplace/service/[slug]/page.tsx)
*   The `[slug]` directory will be replaced by `[id]`.

### UI Components

#### [MODIFY] [ServiceCard.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/ServiceCard.tsx)
*   Update `Link` `href` to use `${service.id}` directly: `/marketplace/service/${service.id}`.
*   Ensure no other references to `service.slug` are used for navigation.

## Verification Plan

### Automated Checks
*   `grep -rn "\.split(" src/app/(public)/marketplace/service*` and `grep -rn "\.split(" src/components/marketplace/ServiceCard*` to ensure no parsing logic remains.
*   `npm run lint` to catch broken imports or props.
*   `npx tsc --noEmit` to verify type safety.

### Manual Verification
*   Confirm navigation from Marketplace to Service details works for:
    *   CUID-based services.
    *   UUID-based services.
*   Capture specific IDs and formats tested and report them.
