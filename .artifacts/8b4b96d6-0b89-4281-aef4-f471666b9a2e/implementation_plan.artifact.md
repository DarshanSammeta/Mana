# Marketplace Service Route Migration (Option A: Pure ID-based)

Migrate the marketplace service detail route from a slug-based structure (`/marketplace/service/[slug]-[id]`) to a pure ID-based structure (`/marketplace/service/[id]`). This eliminates fragile string-splitting logic and provides structural safety across different ID formats (UUID, CUID, etc.).

## User Review Required

> [!IMPORTANT]
> **No Legacy Redirects**: Following the refined strategy, we will **NOT** implement any string-parsing logic to support legacy URLs (`/marketplace/service/[slug]-[id]`). Since the database does not currently have a dedicated `slug` column for lookups, any old-format URLs will result in a clean 404. This is the structurally safest approach and avoids reintroducing the fragility we aim to eliminate.

> [!NOTE]
> The `id` parameter will be treated as an opaque string. We will NOT enforce format constraints (like UUID) at the routing layer to ensure compatibility with any identifier scheme (CUID, UUID, etc.).

## Proposed Changes

### Core Route Migration

#### [DELETE] [service/[slug]/page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/(public)/marketplace/service/[slug]/page.tsx)
#### [NEW] [service/[id]/page.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/(public)/marketplace/service/[id]/page.tsx)

Summary of logic in new `page.tsx`:
- **Direct Lookup Only**: Call `getServiceById(id)` directly using the `id` parameter from `params`.
- **Zero Parsing**: No `.split('-')` or regex-based extraction will exist in the codebase for this route.
- **Explicit 404**: Call `notFound()` immediately if `getServiceById` returns null.
- **Agnostic Validation**: Use `z.string().min(1)` to validate the parameter presence without coupling to a specific ID format.

### Component Updates

#### [MODIFY] [ServiceCard.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/components/marketplace/ServiceCard.tsx)
- Update the `Link` component's `href` to use `${service.id}` directly: `/marketplace/service/${service.id}`.
- Remove `${service.slug}-` prefix from the URL generation.

### Full Reference Sweep
- [MarketplaceClient.tsx](file:///C:/ReactProjects/ManaEventWebApp/src/app/(public)/marketplace/MarketplaceClient.tsx): Confirmed safe (uses API).
- [route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/marketplace/services/route.ts): Confirmed safe (API DTOs contain `id`).
- [marketplace.service.ts](file:///C:/ReactProjects/ManaEventWebApp/src/services/client/marketplace.service.ts): Confirmed safe.

---

## Verification Plan

### Automated Tests
- `grep -rn "\.split(" src/app/(public)/marketplace/service*`: Should return **zero** results.
- `grep -rn "\.split(" src/components/marketplace/ServiceCard*`: Should return **zero** results.
- `npm run lint`: Verify no linting errors.
- `npx tsc --noEmit`: Verify type safety.

### Manual Verification
- **Click-through Test**: Navigate to the marketplace and click 3+ services. Verify they all load correctly at `/marketplace/service/[ID]`.
- **404 Verification**:
    - Visit a legacy URL (e.g., `/marketplace/service/slug-uuid`). Verify it renders the `notFound()` page.
    - Visit a random ID URL. Verify it 404s cleanly.
- **Reporting**: Report the following for verification:
    - Service ID + Format (UUID vs CUID)
    - Final URL
    - Confirmation of successful render
