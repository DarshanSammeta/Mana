# Phase 2 Deliverables: Backend API Design

This document specifies the API contracts and technical implementation strategies for Phase 2.

## 1. API Contracts (New Only)

### `GET /api/marketplace/services` (Primary Search)
- **Filters**: `query`, `category`, `city`, `minPrice`, `maxPrice`, `rating`, `eventType`.
- **Response**:
```typescript
interface ServiceSearchResult {
  services: {
    id: string;
    slug: string;
    title: string;
    category: string;
    startingPrice: number;
    rating: number;
    reviewCount: number;
    vendor: { id: string; businessName: string; isVerified: boolean };
  }[];
  pagination: { total: number; page: number; limit: number };
  metadata?: { // Future-proof metadata
    searchProvider?: string;
    relevanceScore?: number;
    searchTime?: string;
  };
}
```

### `GET /api/services/[id]/reviews` (Booking-Aware)
- **Response**:
```typescript
interface EnhancedReview {
  id: string;
  rating: number;
  comment: string;
  customer: { name: string; avatar?: string };
  booking: {
    eventType: string; // From booking.eventType
    eventDate: string; // From booking.eventDate
    isVerified: boolean;
  };
  vendorReply?: string;
  helpfulVotes: number;
  media: { url: string; type: 'IMAGE' | 'VIDEO' }[];
}
```

## 2. Service Specifications Strategy

Specifications are non-standardized in the current schema. To avoid migrations:
- **Source**: Extract from `Renamedpackage.inclusions` JSON field.
- **Transformation**: A utility function will map common keys (e.g., "Guest Capacity", "Duration") to a `ServiceSpecifications` DTO.
- **Fallback**: If specific keys are missing, values are returned as `null` or omitted. **No hardcoding.**

## 3. Security Strategy

- **Validation**: Strict schema validation using **Zod** for all input parameters (queries, IDs, filters).
- **Authentication**: Leverage existing NextAuth sessions for protected actions (e.g., "Helpful" vote).
- **Injection Prevention**: Use Prisma parameterization for all queries. No string concatenation.
- **XSS**: Sanitize all user-generated content (reviews, vendor replies) before storage and display.
- **Rate Limiting**: Implement per-IP rate limiting for the search and review endpoints via Next.js middleware (integrated with Upstash/Redis).
- **Error Handling**: Standardized JSON error responses with proper HTTP status codes.

## 4. Performance & Caching

- **Redis**: Cache search results for 5 minutes.
- **unstable_cache**: Cache service details and aggregated ratings for 1 hour.
- **Prisma**: Optimized `select` and `include` to fetch only required fields, avoiding N+1 issues by joining `vendorprofile` and `review` metrics in the primary query.

## 5. Implementation Roadmap (Phase 2)

1. Implement Zod schemas for all new API routes.
2. Develop the `ServiceSpecifications` transformation utility.
3. Build the `GET /api/marketplace/services` endpoint (Search/Filter/Sort).
4. Build the `GET /api/services/[id]` sub-resource endpoints (Details, Reviews, Related).
5. Integrate Redis/Upstash rate limiting.
6. Verify API responses against the defined contracts.

## 6. Architecture Compliance Checklist

- ✅ No Prisma schema changes
- ✅ Existing APIs unchanged
- ✅ Existing Booking flow unchanged
- ✅ Existing Payment flow unchanged
- ✅ Existing Vendor Marketplace preserved
- ✅ Backward compatible
- ✅ Phase 2 ready
