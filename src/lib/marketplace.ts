import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { meiliClient, VENDORS_INDEX } from "./meilisearch";
import { trackSearch } from "./intelligence/search-analytics";
import { setCachedData, getCachedData } from "./redis";

import { MarketplaceFilters, MarketplaceVendor } from "@/types/marketplace";
export type { MarketplaceFilters, MarketplaceVendor };
import logger from "./logger";

export async function getMarketplaceVendors(filters: MarketplaceFilters) {
  const { query, city, lat, lng, category } = filters;

  // Enterprise Caching (Level 12)
  const cacheKey = `vendors:search:${JSON.stringify(filters)}`;
  const cached = await getCachedData<any>(cacheKey);
  if (cached) return cached;

  // Track search demand for analytics & heatmaps
  if (query || category) {
    trackSearch({
      query,
      category,
      city,
      lat,
      lng
    }).catch(e => logger.error("Background analytics tracking failed", e));
  }

  const fetchVendors = async (f: MarketplaceFilters) => {
    const {
      category,
      city,
      query,
      minPrice,
      maxPrice,
      rating,
      sort = "featured",
      page = 1,
      limit = 12,
      cursor,
      lat,
      lng,
      featured
    } = f;

    const skip = cursor ? 0 : (page - 1) * limit;

    // Search Analytics & Meilisearch (Level 11)
    let meiliIds: string[] | null = null;
    if (query && meiliClient) {
      try {
        const index = meiliClient.index(VENDORS_INDEX);
        const searchRes = await index.search(query, {
          limit: 200, // Increased to ensure enough candidates for combined filtering
          attributesToRetrieve: ['id'],
          filter: city ? `city = "${city}"` : undefined,
        });
        meiliIds = searchRes.hits.map((h: any) => h.id);

        if (meiliIds && meiliIds.length === 0) {
          return { vendors: [], total: 0, page, limit, totalPages: 0 };
        }
      } catch (error) {
        logger.error("Meilisearch query failed, falling back to optimized Prisma FTS", { error, query });
      }
    }

    const latNum = lat ?? null;
    const lngNum = lng ?? null;

    // Optimized Distance Calculation (Haversine formula)
    const distanceSql = (latNum !== null && lngNum !== null)
      ? Prisma.sql`(6371 * acos(least(1, cos(radians(${latNum})) * cos(radians(v.latitude)) * cos(radians(v.longitude) - radians(${lngNum})) + sin(radians(${latNum})) * sin(radians(v.latitude)))))`
      : Prisma.sql`NULL`;

    // Optimized Search using PostgreSQL Full-Text Search (Fallback)
    const searchQuery = query ? Prisma.sql`AND (
      to_tsvector('english', v."businessName" || ' ' || COALESCE(v.description, '') || ' ' || COALESCE(v.city, '')) @@ websearch_to_tsquery('english', ${query})
      OR EXISTS (
        SELECT 1 FROM service s
        LEFT JOIN servicetype st ON s."serviceTypeId" = st.id
        WHERE s."vendorProfileId" = v.id AND (
          to_tsvector('english', s.title || ' ' || s.description || ' ' || COALESCE(st.name, '')) @@ websearch_to_tsquery('english', ${query})
        )
      )
    )` : Prisma.empty;

    const baseQuery = Prisma.sql`
      FROM vendorprofile v
      WHERE v."verificationStatus" = 'APPROVED'
      ${meiliIds ? Prisma.sql` AND v.id IN (${Prisma.join(meiliIds)})` : Prisma.empty}
      ${featured ? Prisma.sql` AND v.featured = true` : Prisma.empty}
      ${(latNum !== null && lngNum !== null) ? Prisma.sql` AND v.latitude IS NOT NULL AND v.longitude IS NOT NULL` : Prisma.empty}
      ${city && !meiliIds ? Prisma.sql` AND v.city ILIKE ${city}` : Prisma.empty}
      ${!meiliIds ? searchQuery : Prisma.empty}
      ${category ? Prisma.sql` AND EXISTS (
          SELECT 1 FROM service s
          JOIN servicetype st ON s."serviceTypeId" = st.id
          JOIN subcategory sc ON st."subcategoryId" = sc.id
          JOIN category c ON sc."categoryId" = c.id
          WHERE s."vendorProfileId" = v.id AND (
            c.name = ${category} OR sc.name = ${category}
          )
      )` : Prisma.empty}
      ${(minPrice !== undefined || maxPrice !== undefined) ? Prisma.sql` AND (
        EXISTS (
          SELECT 1 FROM "package" p
          JOIN service s ON p."serviceId" = s.id
          WHERE s."vendorProfileId" = v.id
          AND p.price BETWEEN ${minPrice ?? 0} AND ${maxPrice ?? 99999999}
        ) OR EXISTS (
          SELECT 1 FROM service s
          WHERE s."vendorProfileId" = v.id
          AND s."basePrice" BETWEEN ${minPrice ?? 0} AND ${maxPrice ?? 99999999}
        )
      )` : Prisma.empty}
      ${rating !== undefined && rating > 0 ? Prisma.sql` AND v.rating >= ${rating}` : Prisma.empty}
    `;


    const countResult = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT COUNT(DISTINCT v.id)::text as total ${baseQuery}
    `);
    const total = parseInt(countResult[0]?.total || "0");

    const minPriceSql = Prisma.sql`(
      SELECT MIN(price_val)
      FROM (
        SELECT MIN(p.price) as price_val FROM "package" p JOIN service s ON p."serviceId" = s.id WHERE s."vendorProfileId" = v.id
        UNION ALL
        SELECT MIN(s."basePrice") as price_val FROM service s WHERE s."vendorProfileId" = v.id
      ) as all_prices
    )`;

    let orderBy = Prisma.sql` ORDER BY v."createdAt" DESC`;
    if (sort === "price_low") {
      orderBy = Prisma.sql` ORDER BY ${minPriceSql} ASC`;
    } else if (sort === "price_high") {
      orderBy = Prisma.sql` ORDER BY ${minPriceSql} DESC`;
    } else if (sort === "rating") {
      orderBy = Prisma.sql` ORDER BY v.rating DESC`;
    } else if (sort === "popularity") {
      orderBy = Prisma.sql` ORDER BY v."totalBookings" DESC`;
    } else if (sort === "newest") {
      orderBy = Prisma.sql` ORDER BY v."createdAt" DESC`;
    } else if (sort === "featured" || sort === "nearby") {
      // Intelligent Weighted Ranking
      // Priorities: Distance (0.3), Rating (0.3), Verified/Premium (0.2), Bookings (0.1), Response Time (0.1)
      orderBy = Prisma.sql`
        ORDER BY (
          COALESCE(${distanceSql}, 50) * 0.3 -
          COALESCE(v.rating, 0) * 2.0 -
          (CASE WHEN v."verificationStatus" = 'APPROVED' THEN 5 ELSE 0 END) -
          (CASE WHEN v.featured = true THEN 5 ELSE 0 END) -
          COALESCE(v."totalBookings", 0) * 0.05 +
          COALESCE(v."responseTime", 24) * 0.1
        ) ASC`;
    }

    const vendorsData = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        v.id,
        ${minPriceSql} as "minPrice",
        ${distanceSql} as distance
      ${baseQuery}
      ${orderBy}
      LIMIT ${limit} OFFSET ${skip}
    `);

    const vendorIds = vendorsData.map(v => v.id);

    if (vendorIds.length === 0) {
      const emptyResult = { vendors: [], total, page, limit, totalPages: 0 };
      await setCachedData(cacheKey, emptyResult, 300);
      return emptyResult;
    }

    const fullVendors = await prisma.vendorprofile.findMany({
      where: { id: { in: vendorIds } },
      select: {
        id: true,
        businessName: true,
        logo: true,
        coverImage: true,
        city: true,
        rating: true,
        reviewCount: true,
        totalBookings: true,
        searchScore: true,
        featured: true,
        verificationStatus: true,
        latitude: true,
        longitude: true,
        serviceRadius: true,
        maxTravelDistance: true,
        travelChargesPerKm: true,
        baseTravelCharge: true,
        service: {
          take: 1,
          select: {
            id: true,
            title: true,
            basePrice: true,
            servicetype: {
              select: {
                name: true,
                subcategory: {
                  select: {
                    name: true,
                    category: { select: { name: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    const finalVendors = vendorIds.map(id => {
      const v = fullVendors.find(fv => fv.id === id);
      if (!v) return null;
      const raw = vendorsData.find(rv => rv.id === id)!;

      return {
        ...v,
        basePrice: Number(raw.minPrice),
        service: v.service.map(s => ({
          ...s,
          basePrice: Number(s.basePrice)
        })),
        distance: raw.distance !== null ? Number(raw.distance) : Infinity,
        minPrice: raw.minPrice !== null ? Number(raw.minPrice) : Infinity,
        travelCharge: v.baseTravelCharge ? Number(v.baseTravelCharge) + (raw.distance && v.serviceRadius && raw.distance > v.serviceRadius ? (raw.distance - v.serviceRadius) * Number(v.travelChargesPerKm || 0) : 0) : 0,
      };
    }).filter(v => v !== null);

    const result = {
      vendors: finalVendors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

    // Cache in Redis for Level 12
    await setCachedData(cacheKey, result, 300); // 5 mins cache

    return result;
  };

  return fetchVendors(filters);
}

export async function getMarketplaceCategories(eventTypeId?: string) {
  const fetchCategories = async (eid?: string) => {
    const categories = await prisma.category.findMany({
      where: eid ? {
        eventtypes: {
          some: { id: eid }
        }
      } : undefined,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
        commissionRate: true,
        subcategory: {
          select: {
            id: true,
            name: true,
            servicetype: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    const rawCounts = await prisma.$queryRaw<any[]>`
      SELECT sc."id" as "categoryId", COUNT(DISTINCT s."vendorProfileId")::int as "vendorCount"
      FROM "service" s
      JOIN "servicetype" st ON s."serviceTypeId" = st.id
      JOIN "subcategory" stub ON st."subcategoryId" = stub.id
      JOIN "category" sc ON stub."categoryId" = sc.id
      JOIN "vendorprofile" v ON s."vendorProfileId" = v.id
      WHERE v."verificationStatus" = 'APPROVED'
      ${eid ? Prisma.sql` AND EXISTS (
        SELECT 1 FROM "_EventTypeToCategory" etc
        WHERE etc."A" = sc.id AND etc."B" = ${eid}
      )` : Prisma.empty}
      GROUP BY sc."id"
    `;

    const countMap = rawCounts.reduce((acc, curr) => {
      acc[curr.categoryId] = curr.vendorCount;
      return acc;
    }, {} as Record<string, number>);

    return categories.map(cat => ({
      ...cat,
      vendorCount: countMap[cat.id] || 0
    }));
  };

  return unstable_cache(
    () => fetchCategories(eventTypeId),
    ['marketplace-categories', eventTypeId || 'all'],
    { revalidate: 3600, tags: ['categories'] }
  )();
}

export async function getEventTypes() {
  return unstable_cache(
    async () => {
      return await prisma.eventtype.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          image: true,
          icon: true,
        },
        orderBy: { name: "asc" }
      });
    },
    ['event-types-list'],
    { revalidate: 3600, tags: ['event-types'] }
  )();
}

export async function getVendorById(id: string) {
  const fetchVendor = async (vendorId: string) => {
    try {
      // Parallelize vendor fetch and similar vendors search
      const [vendor] = await Promise.all([
        prisma.vendorprofile.findUnique({
          where: { id: vendorId },
          select: {
            id: true,
            userId: true,
            businessName: true,
            description: true,
            logo: true,
            coverImage: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            latitude: true,
            longitude: true,
            serviceRadius: true,
            verificationStatus: true,
            rating: true,
            reviewCount: true,
            completionRate: true,
            responseTime: true,
            totalBookings: true,
            searchScore: true,
            featured: true,
            service: {
              select: {
                id: true,
                title: true,
                description: true,
                pricingType: true,
                basePrice: true,
                Renamedpackage: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    inclusions: true
                  }
                },
                servicetype: {
                  select: {
                    id: true,
                    name: true,
                    subcategory: {
                      select: {
                        id: true,
                        name: true,
                        category: {
                          select: {
                            id: true,
                            name: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            portfolio: {
              select: {
                id: true,
                mediaUrl: true,
                mediaType: true,
                title: true
              }
            },
            review: {
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                user: { select: { fullName: true } }
              },
              orderBy: { createdAt: "desc" },
              take: 5
            },
            availability: {
              where: {
                date: { gte: new Date() }
              },
              take: 15,
              orderBy: { date: "asc" }
            },
          }
        })
      ]);

      if (!vendor) return null;

      const primaryCategoryId = vendor.service?.[0]?.servicetype?.subcategory?.category?.id;
      let similarVendors: any[] = [];

      if (primaryCategoryId) {
        const rawSimilar = await prisma.vendorprofile.findMany({
          where: {
            id: { not: vendorId },
            verificationStatus: "APPROVED",
            service: {
              some: {
                servicetype: {
                  subcategory: {
                    categoryId: primaryCategoryId
                  }
                }
              }
            }
          },
          take: 4,
          select: {
            id: true,
            businessName: true,
            coverImage: true,
            city: true,
            rating: true,
            reviewCount: true,
            featured: true,
            service: {
              take: 1,
              select: {
                basePrice: true,
                Renamedpackage: {
                  take: 1,
                  select: {
                    price: true
                  }
                }
              }
            }
          }
        });

        similarVendors = rawSimilar.map(v => {
          const s = v.service[0];
          const startingPrice = s?.Renamedpackage?.[0]?.price ?? s?.basePrice ?? 0;

          return {
            id: v.id,
            businessName: v.businessName,
            coverImage: v.coverImage,
            rating: v.rating ? Number(v.rating).toFixed(1) : "0.0",
            reviewCount: v.reviewCount || 0,
            basePrice: Number(startingPrice),
            city: v.city,
            featured: v.featured
          };
        });
      }

      const serializedVendor = {
        ...vendor,
        service: vendor.service.map(s => ({
          ...s,
          basePrice: Number(s.basePrice),
          Renamedpackage: s.Renamedpackage.map(p => ({
            ...p,
            price: Number(p.price)
          }))
        }))
      };

      return { vendor: serializedVendor, similarVendors };
    } catch (error) {
      logger.error("Error in getVendorById", { error, vendorId: id });
      throw error;
    }
  };

  return unstable_cache(
    () => fetchVendor(id),
    [`vendor-${id}`],
    { revalidate: 3600, tags: [`vendor-${id}`, 'vendors'] }
  )();
}
