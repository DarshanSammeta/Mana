# Low-Level Design (LLD): Amazon-Style Marketplace Transformation

This document specifies the architecture, API design, and implementation roadmap for converting the Mana Events Marketplace into an Amazon-style product/service shopping experience.

## 1. Architecture Impact Analysis

- **Current State**: Search results are `VendorProfile` entities. Clicking a card leads to a Vendor profile where services are secondary.
- **Target State**: Search results are `Service` (Product) entities. Each card represents a specific offering (e.g., "Standard Wedding Stage Decoration"). Clicking a card leads to a `ServiceDetails` page.
- **Entity Relationship**: `Service` belongs to `VendorProfile`. Multiple services from the same vendor will appear as separate cards if they match the search criteria. All business logic and financial transactions remain tied to the `VendorProfile`.
- **URL Strategy**: Use SEO-friendly slugs combined with IDs (e.g., `/marketplace/service/luxury-wedding-decor-abc123`) for robust routing and indexing.
- **Vendor Store**: Maintain and link to full Vendor Profile pages (`/marketplace/vendor/[id]`) from every service card and detail page.

## 2. Database Impact Analysis

- **Schema Changes**: **None allowed.** We will leverage existing models: `service`, `Renamedpackage`, `review`, and `vendorprofile`.
- **Query Optimization**: New queries will perform deeper joins to aggregate:
    - Min price from `Renamedpackage`.
    - Average rating and review count from `review` (filtered by `serviceId`).
    - Vendor reputation metrics (featured, verified) from `vendorprofile`.
- **Service Specifications**: No new columns. Specifications will be dynamically extracted from `Renamedpackage.inclusions` JSON and transformed into a normalized DTO. If data is missing, null values are returned. Advanced specifications are deferred to future schema updates.

## 3. API Design (New Endpoints Only)

### `GET /api/marketplace/services`
**Purpose**: The **single primary endpoint** for Amazon-style search, filtering, sorting, and pagination.
**Parameters**: `query`, `category`, `minPrice`, `maxPrice`, `rating`, `city`, `sort`, `page`, `limit`.
**Response**:
```json
{
  "services": [...],
  "pagination": { "total": 1200, "pages": 100 },
  "metadata": {
    "searchProvider": "Prisma-FTS",
    "rankingVersion": "v1.0",
    "searchTime": "45ms"
  }
}
```

### `GET /api/services/[id]`
**Purpose**: Fetch full details for the Service Details Page, including packages and specifications.

### `GET /api/services/[id]/reviews`
**Purpose**: Paginated, booking-aware reviews specific to this service. Includes `eventType`, `eventDate`, and `verifiedBooking` status.

### `GET /api/services/[id]/related`
**Purpose**: Frequently booked together, more from this vendor, and similar services.

## 4. Folder & File Structure

```text
src/
├── app/api/
│   ├── marketplace/services/route.ts    # Primary Search/Filter/Sort API
│   └── services/
│       └── [id]/
│           ├── route.ts                 # Service Core Details & Specs
│           ├── reviews/route.ts         # Booking-aware Reviews
│           └── related/route.ts         # FBT, More from Vendor, Similar
├── app/(public)/marketplace/
│   └── service/[slug-id]/               # SEO-friendly Details Page
├── components/marketplace/
│   ├── ProductCard.tsx                  # Amazon-style Service card
│   ├── details/                         # Service Details UI components
│   │   ├── ServiceGallery.tsx
│   │   ├── EventSpecs.tsx               # Suitable events, capacity, duration
│   │   └── PurchaseBox.tsx              # Sticky Action Bar
│   └── reviews/                         # Enhanced Review components
└── services/client/
    └── service-marketplace.service.ts   # Client-side API wrapper
```

## 5. SEO Strategy

- **URL Structure**: `/service/[slug]-[id]` where `slug` is derived from the title for indexing.
- **Canonical URLs**: Every service page will have a self-referencing canonical tag to prevent duplicate content issues.
- **Metadata**: Dynamic generation of titles and descriptions using Next.js `generateMetadata`.
- **JSON-LD**: Implementation of `Schema.org/Service` structured data (or `Product` where appropriate) for Rich Snippets.
- **Social**: Full support for OpenGraph and Twitter Cards with high-quality service images.
- **Sitemaps**: Future support for dynamic service sitemaps via `sitemap.ts`.

## 6. Review System Design

- **Booking-Awareness**: Reviews are joined with the `booking` table (without schema changes) to display the event context (e.g., "Reviewed for a Wedding").
- **Social Proof**: Response includes `verifiedBooking` badge, `helpfulVotes`, and vendor replies.

## 7. Non-Functional Requirements

- **Performance**: Heavy use of `unstable_cache` for aggregation and Redis for search results. Zero client-side over-fetching.
- **Scalability**: Stateless API design; search filtering optimized via database indexing.
- **Observability**: Standardized logging for search performance and API error rates.
- **Compatibility**: 100% backward compatibility with the existing vendor marketplace and booking flow.

## 8. Architecture Compliance Checklist

- ✅ No Prisma schema changes
- ✅ Existing APIs unchanged
- ✅ Existing Booking flow unchanged
- ✅ Existing Payment flow unchanged
- ✅ Existing Vendor Marketplace preserved
- ✅ Backward compatible
- ✅ Phase 2 ready
