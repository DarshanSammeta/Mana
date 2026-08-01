import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getCachedData, setCachedData } from "@/lib/redis";
import { serializePrisma } from "@/lib/serialization";

/**
 * Zod Schema for Search Filters
 */
const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  eventType: z.string().optional(),
  sort: z.enum(['featured', 'newest', 'price_low', 'price_high', 'rating', 'popularity']).default('featured'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/marketplace/services
 * Amazon-style service search and filtering
 */
export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(req.url);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";

    // 1. Rate Limiting (Phase 2 Constraint)
    const ratelimit = await rateLimit(`search_services:${ip}`, { limit: 30, window: 60 });
    if (!ratelimit.success) return rateLimitResponse(ratelimit);

    // 2. Validation
    const filters = searchSchema.parse(Object.fromEntries(searchParams));

    // 3. Caching Strategy (L1: Redis)
    const cacheKey = `services:search:${JSON.stringify(filters)}`;
    const cached = await getCachedData<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 4. Data Fetching (Prisma Query Strategy)
    const skip = (filters.page - 1) * filters.limit;
    const prisma = getPrisma();

    // Define Base Where Clause
    const where: any = {
      vendorprofile: {
        verificationStatus: 'APPROVED',
        isActive: true,
      },
    };

    const andConditions: any[] = [];

    if (filters.query) {
      andConditions.push({
        OR: [
          { title: { contains: filters.query, mode: 'insensitive' } },
          { description: { contains: filters.query, mode: 'insensitive' } },
        ]
      });
    }

    if (filters.category) {
      /**
       * LEGACY FALLBACK (SubNavbar/MoreDropdown):
       * The navigation links currently pass 'eventType' names (e.g. "Wedding")
       * in the 'category' query parameter.
       *
       * TODO: Phase out this fallback once frontend strictly uses ?eventType= for event types.
       * This query fanned-out across relations but is now optimized with 'equals'.
       */
      andConditions.push({
        OR: [
          {
            servicetype: {
              subcategory: {
                category: {
                  name: { equals: filters.category, mode: 'insensitive' }
                }
              }
            }
          },
          {
            servicetype: {
              subcategory: {
                name: { equals: filters.category, mode: 'insensitive' }
              }
            }
          },
          {
            servicetype: {
              subcategory: {
                category: {
                  eventtype: { name: { equals: filters.category, mode: 'insensitive' } }
                }
              }
            }
          }
        ]
      });
    }

    if (filters.city) {
      where.vendorprofile.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.eventType) {
      andConditions.push({
        servicetype: {
          subcategory: {
            category: {
              eventtype: { name: { contains: filters.eventType, mode: 'insensitive' } }
            }
          }
        }
      });
    }

    if (filters.rating) {
      where.vendorprofile.rating = { gte: filters.rating };
    }

    // Price filtering (joins packages)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      andConditions.push({
        OR: [
          {
            Renamedpackage: {
              some: {
                price: {
                  gte: filters.minPrice || 0,
                  lte: filters.maxPrice || 99999999,
                }
              }
            }
          },
          {
            basePrice: {
              gte: filters.minPrice || 0,
              lte: filters.maxPrice || 99999999,
            }
          }
        ]
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Define Sort Order
    let orderBy: any = { createdAt: 'desc' };
    if (filters.sort === 'price_low') orderBy = { basePrice: 'asc' };
    if (filters.sort === 'price_high') orderBy = { basePrice: 'desc' };
    if (filters.sort === 'rating') orderBy = { vendorprofile: { rating: 'desc' } };
    if (filters.sort === 'popularity') orderBy = { vendorprofile: { totalBookings: 'desc' } };
    if (filters.sort === 'featured') orderBy = { vendorprofile: { searchScore: 'desc' } };

    // Execute Main Query
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy,
        select: {
          id: true,
          title: true,
          createdAt: true,
          basePrice: true,
          vendorprofile: {
            select: {
              id: true,
              businessName: true,
              city: true,
              rating: true,
              verificationStatus: true,
              featured: true,
              totalBookings: true
            }
          },
          portfolio: {
            take: 1,
            select: { mediaUrl: true }
          },
          Renamedpackage: {
            orderBy: { price: 'asc' },
            take: 1,
            select: { price: true }
          },
          servicetype: {
            select: {
              subcategory: {
                select: { name: true }
              }
            }
          },
          _count: {
            select: { review: true }
          }
        }
      }),
      prisma.service.count({ where })
    ]);

    // 5. Transformation (To Approved DTO)
    const formattedServices = services
      .filter((s: any) => s && s.vendorprofile && s.vendorprofile.id) // Guarantee vendor data integrity
      .map((s: any) => {
        const startingPrice = s.Renamedpackage?.[0]?.price || s.basePrice;
        const badges = [];
        if (s.vendorprofile.featured) badges.push("Premium");
        if (s.vendorprofile.totalBookings > 50) badges.push("Bestseller");
        if (Date.now() - new Date(s.createdAt).getTime() < 1000 * 60 * 60 * 24 * 30) {
          badges.push("New Arrival");
        }

        return {
          id: s.id,
          slug: s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: s.title,
          category: s.servicetype?.subcategory?.name || "Service",
          startingPrice: Number(startingPrice),
          rating: s.vendorprofile.rating || 0,
          reviewCount: s._count.review || 0,
          images: s.portfolio.map((p: any) => p.mediaUrl),
          vendor: {
            id: s.vendorprofile.id,
            businessName: s.vendorprofile.businessName,
            city: s.vendorprofile.city,
            isVerified: s.vendorprofile.verificationStatus === 'APPROVED'
          },
          badges,
        };
      });

    const result = {
      services: formattedServices,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit)
      },
      metadata: {
        searchProvider: "Prisma-FTS",
        rankingVersion: "v1.0",
        searchTime: `${Date.now() - new Date().getTime()}ms` // Placeholder for actual perf tracking
      }
    };

    const serialized = serializePrisma(result);

    // 6. Cache and Return
    await setCachedData(cacheKey, serialized, 300); // 5 mins cache

    return NextResponse.json(serialized);
  }, req);
}
