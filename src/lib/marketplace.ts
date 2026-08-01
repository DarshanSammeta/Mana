import { getPrisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getMeiliSearch, VENDORS_INDEX } from "./meilisearch";
import { trackSearch } from "./intelligence/search-analytics";
import { setCachedData, getCachedData } from "./redis";
import { serializePrisma } from "./serialization";
import { VendorRankingService } from "./services/vendor-ranking.service";

import { MarketplaceFilters, MarketplaceVendor } from "@/types/marketplace";
export type { MarketplaceFilters, MarketplaceVendor };
import logger from "./logger";

// Request-level memoization for marketplace data fetchers
/**
 * Optimized Search for Services (Amazon-style)
 * Fetches services with vendor and package details
 */
export const getMarketplaceServices = cache(async (filters: any) => {
  const { query, category, city, minPrice, maxPrice, rating, sort = "featured", page = 1, limit = 12, eventTypeId } = filters;
  const prisma = getPrisma();
  const skip = (page - 1) * limit;

  const where: any = {
    vendorprofile: {
      verificationStatus: 'APPROVED',
      isActive: true,
    },
  };

  const andConditions: any[] = [];

  if (query) {
    andConditions.push({
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    });
  }

  if (category) {
    andConditions.push({
      servicetype: {
        subcategory: {
          OR: [
            { name: { contains: category, mode: 'insensitive' } },
            { category: { name: { contains: category, mode: 'insensitive' } } },
          ]
        }
      }
    });
  }

  if (city) {
    where.vendorprofile.city = { contains: city, mode: 'insensitive' };
  }

  if (eventTypeId) {
    andConditions.push({
      servicetype: {
        subcategory: {
          category: { eventTypeId }
        }
      }
    });
  }

  if (rating) {
    where.vendorprofile.rating = { gte: rating };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    andConditions.push({
      OR: [
        { Renamedpackage: { some: { price: { gte: minPrice || 0, lte: maxPrice || 99999999 } } } },
        { basePrice: { gte: minPrice || 0, lte: maxPrice || 99999999 } }
      ]
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_low') orderBy = { basePrice: 'asc' };
  if (sort === 'price_high') orderBy = { basePrice: 'desc' };
  if (sort === 'rating') orderBy = { vendorprofile: { rating: 'desc' } };
  if (sort === 'popularity') orderBy = { vendorprofile: { totalBookings: 'desc' } };
  if (sort === 'featured') orderBy = { vendorprofile: { searchScore: 'desc' } };

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        vendorprofile: {
          select: {
            id: true, businessName: true, city: true, rating: true, verificationStatus: true, featured: true, totalBookings: true
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
        servicetype: { include: { subcategory: true } },
        _count: { select: { review: true } }
      }
    }),
    prisma.service.count({ where })
  ]);

  const formattedServices = services
    .filter((s: any) => s && s.vendorprofile && s.vendorprofile.id) // Guarantee vendor data integrity
    .map((s: any) => {
      const startingPrice = s.Renamedpackage?.[0]?.price || s.basePrice;
      const badges = [];
      if (s.vendorprofile.featured) badges.push("Premium");
      if (s.vendorprofile.totalBookings > 50) badges.push("Bestseller");
      if (Date.now() - new Date(s.createdAt).getTime() < 1000 * 60 * 60 * 24 * 30) badges.push("New Arrival");

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


  return serializePrisma({
    services: formattedServices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
});

export const getMarketplaceVendors = cache(async (filters: MarketplaceFilters) => {
  const { query, city, lat, lng, category } = filters;
  const startTime = performance.now();

  // Enterprise Caching (Level 12)
  const cacheKey = `vendors:search:v3:${JSON.stringify(filters)}`;
  const cached = await getCachedData<any>(cacheKey);
  if (cached) {
      const duration = performance.now() - startTime;
      if (duration > 300) logger.info(`[PERF] getMarketplaceVendors (CACHED) took ${duration.toFixed(2)}ms`);
      return cached;
  }

  // Track search demand for analytics & heatmaps (non-blocking)
  if (query || category) {
    trackSearch({ query, category, city, lat, lng }).catch((e) => logger.error("Background analytics tracking failed", e));
  }

  const fetchVendors = async (f: MarketplaceFilters) => {
    const {
      category, city, query, minPrice, maxPrice, rating,
      sort = "featured", page = 1, limit = 12, cursor, lat, lng, featured,
    } = f;

    const skip = cursor ? 0 : (page - 1) * limit;

    // Phase 2: Parallelize external services and category metadata
    const [meiliIds, categoryAvgPrice] = await Promise.all([
        (async () => {
            const meiliClient = getMeiliSearch();
            if (query && meiliClient) {
                try {
                    const index = meiliClient.index(VENDORS_INDEX);
                    const searchRes = await index.search(query, {
                        limit: 200,
                        attributesToRetrieve: ["id"],
                        filter: city ? `city = "${city}"` : undefined,
                    });
                    return searchRes.hits.map((h: any) => h.id);
                } catch (error) {
                    // Fail silently for search, falling back to optimized Prisma FTS
                }
            }
            return null;
        })(),
        (async () => {
            if (category) {
                const cat = await getPrisma().category.findFirst({
                    where: { name: category },
                    select: { id: true },
                });
                if (cat) return VendorRankingService.getCategoryAveragePrice(cat.id);
            }
            return 0;
        })()
    ]);

    if (meiliIds && meiliIds.length === 0) {
        return { vendors: [], total: 0, page, limit, totalPages: 0 };
    }

    const latNum = lat ?? null;
    const lngNum = lng ?? null;

    const distanceSql =
      latNum !== null && lngNum !== null
        ? Prisma.sql`(6371 * acos(least(1, cos(radians(${latNum})) * cos(radians(v.latitude)) * cos(radians(v.longitude) - radians(${lngNum})) + sin(radians(${latNum})) * sin(radians(v.latitude)))))`
        : Prisma.sql`NULL`;

    const searchQuery = query
      ? Prisma.sql`AND (
      v."businessName" ILIKE ${`%${query}%`}
      OR EXISTS (
        SELECT 1 FROM service s
        WHERE s."vendorProfileId" = v.id AND (s.title ILIKE ${`%${query}%`} OR s.description ILIKE ${`%${query}%`})
      )
    )`
      : Prisma.empty;

    const baseQuery = Prisma.sql`
      FROM vendorprofile v
      WHERE v."verificationStatus" = 'APPROVED'
      ${meiliIds ? Prisma.sql` AND v.id IN (${Prisma.join(meiliIds)})` : Prisma.empty}
      ${featured ? Prisma.sql` AND v.featured = true` : Prisma.empty}
      ${latNum !== null && lngNum !== null ? Prisma.sql` AND v.latitude IS NOT NULL AND v.longitude IS NOT NULL` : Prisma.empty}
      ${city && !meiliIds ? Prisma.sql` AND v.city ILIKE ${city}` : Prisma.empty}
      ${!meiliIds ? searchQuery : Prisma.empty}
      ${category ? Prisma.sql`
          AND EXISTS (
              SELECT 1 
              FROM service s
              JOIN servicetype st ON s."serviceTypeId" = st.id
              JOIN subcategory sc ON st."subcategoryId" = sc.id
              JOIN category c ON sc."categoryId" = c.id
              WHERE s."vendorProfileId" = v.id
              AND (c.name = ${category} OR sc.name = ${category} OR c."eventTypeId" IN (SELECT id FROM eventtype WHERE name = ${category}))
          )
          ` : Prisma.empty}
      ${filters.eventTypeId ? Prisma.sql` AND EXISTS (
          SELECT 1 FROM service s
          JOIN servicetype st ON s."serviceTypeId" = st.id
          JOIN subcategory sc ON st."subcategoryId" = sc.id
          JOIN category c ON sc."categoryId" = c.id
          WHERE s."vendorProfileId" = v.id AND c."eventTypeId" = ${filters.eventTypeId}
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

    // Phase 5: Optimized Min Price calculation (Simplified for performance)
    const minPriceSql = Prisma.sql`COALESCE((SELECT MIN(p.price) FROM "package" p JOIN service s ON p."serviceId" = s.id WHERE s."vendorProfileId" = v.id), v."baseTravelCharge", 0)`;

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
      orderBy = Prisma.sql`
        ORDER BY (
          COALESCE(${distanceSql}, 50) * 0.4 -
          COALESCE(v.rating, 0) * 4.0 -
          (CASE WHEN v."verificationStatus" = 'APPROVED' THEN 10 ELSE 0 END) -
          (CASE WHEN v.featured = true THEN 15 ELSE 0 END) -
          COALESCE(v."totalBookings", 0) * 0.1 -
          COALESCE(v."completionRate", 0) * 0.05 +
          COALESCE(v."responseTime", 24) * 0.2
        ) ASC`;
    }

    const vendorsData = await getPrisma().$queryRaw<any[]>(Prisma.sql`
      SELECT
        v.id,
        ${minPriceSql} as "minPrice",
        ${distanceSql} as distance,
        COUNT(*) OVER()::text as "totalCount"
      ${baseQuery}
      ${orderBy}
      LIMIT ${limit} OFFSET ${skip}
    `);

    const total = parseInt(vendorsData[0]?.totalCount || "0");
    const vendorIds = vendorsData.map((v) => v.id);

    if (vendorIds.length === 0) {
      const emptyResult = { vendors: [], total, page, limit, totalPages: 0 };
      await setCachedData(cacheKey, emptyResult, 300);
      return emptyResult;
    }

    const fullVendors = await getPrisma().vendorprofile.findMany({
      where: { id: { in: vendorIds } },
      select: {
        id: true, businessName: true, logo: true, coverImage: true, city: true, rating: true,
        reviewCount: true, totalBookings: true, featured: true, verificationStatus: true,
        latitude: true, longitude: true, serviceRadius: true, maxTravelDistance: true,
        travelChargesPerKm: true, baseTravelCharge: true,
        service: {
          take: 1,
          select: {
            title: true, basePrice: true,
            servicetype: {
              select: {
                name: true,
                subcategory: {
                  select: { name: true, category: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    // Phase 2: AI scores are already calculated in parallel within maps if needed
    const finalVendors = await Promise.all(
      vendorIds.map(async (id) => {
        const v = fullVendors.find((fv) => fv.id === id);
        if (!v) return null;
        const raw = vendorsData.find((rv) => rv.id === id)!;

        // Calculate AI Weighted Score
        const ranking = await VendorRankingService.calculateScore(
          { ...v, basePrice: Number(raw.minPrice) },
          { lat: latNum ?? undefined, lng: lngNum ?? undefined, categoryAvgPrice },
        );

        return {
          ...v,
          basePrice: Number(raw.minPrice),
          service: v.service.map((s) => ({ ...s, basePrice: Number(s.basePrice) })),
          distance: raw.distance !== null ? Number(raw.distance) : Infinity,
          minPrice: raw.minPrice !== null ? Number(raw.minPrice) : Infinity,
          travelCharge: v.baseTravelCharge ? Number(v.baseTravelCharge) + (raw.distance && v.serviceRadius && raw.distance > v.serviceRadius ? (raw.distance - v.serviceRadius) * Number(v.travelChargesPerKm || 0) : 0) : 0,
          rankingScore: ranking.totalScore,
          rankingReasons: ranking.reasons,
        };
      }),
    );

    const result = {
      vendors: finalVendors.filter((v) => v !== null),
      total, page, limit, totalPages: Math.ceil(total / limit),
    };

    const serialized = serializePrisma(result);
    await setCachedData(cacheKey, serialized, 300);

    return serialized;
  };

  const finalResult = await fetchVendors(filters);
  const totalTime = performance.now() - startTime;
  if (totalTime > 300) logger.info(`[PERF] getMarketplaceVendors took ${totalTime.toFixed(2)}ms`, { filters });

  return finalResult;
});

export const getMarketplaceCategories = cache(async (eventTypeId?: string) => {
  const fetchCategories = async (eid?: string) => {
    const prisma = getPrisma();
    const startTime = performance.now();

    // Phase 2: Parallelize categories fetch and vendor counts
    const [categories, rawCounts] = await Promise.all([
        prisma.category.findMany({
            where: eid ? { eventTypeId: eid } : undefined,
            orderBy: { name: "asc" },
            select: {
                id: true, name: true, icon: true, description: true, commissionRate: true, eventTypeId: true,
                subcategory: {
                    take: 10,
                    select: {
                        id: true, name: true,
                        servicetype: { take: 5, select: { id: true, name: true, description: true } },
                    },
                },
            },
        }),
        prisma.$queryRaw<any[]>`
            SELECT sc."categoryId", COUNT(DISTINCT s."vendorProfileId")::int as "vendorCount"
            FROM "service" s
            JOIN "servicetype" st ON s."serviceTypeId" = st.id
            JOIN "subcategory" sc ON st."subcategoryId" = sc.id
            JOIN "vendorprofile" v ON s."vendorProfileId" = v.id
            WHERE v."verificationStatus" = 'APPROVED'
            ${eid ? Prisma.sql` AND sc."categoryId" IN (SELECT id FROM "category" WHERE "eventTypeId" = ${eid})` : Prisma.empty}
            GROUP BY sc."categoryId"
        `
    ]);

    const countMap = rawCounts.reduce((acc, curr) => {
        acc[curr.categoryId] = curr.vendorCount;
        return acc;
    }, {} as Record<string, number>);

    const result = categories.map((cat) => ({
      ...cat,
      vendorCount: countMap[cat.id] || 0,
    }));

    const duration = performance.now() - startTime;
    if (duration > 300) logger.info(`[PERF] getMarketplaceCategories took ${duration.toFixed(2)}ms`, { eid });

    return serializePrisma(result);
  };

  return unstable_cache(
    () => fetchCategories(eventTypeId),
    ["marketplace-categories-v3", eventTypeId || "all"],
    { revalidate: 3600, tags: ["categories"] },
  )();
});

export const getEventTypes = cache(async (vendorId?: string) => {
  return unstable_cache(
    async () => {
      const prisma = getPrisma();
      const eventTypes = await prisma.eventtype.findMany({
        where: {
          isActive: true,
          ...(vendorId
            ? {
                categories: {
                  some: {
                    subcategory: {
                      some: {
                        servicetype: {
                          some: {
                            service: {
                              some: {
                                vendorProfileId: vendorId,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          image: true,
          icon: true,
        },
        orderBy: { name: "asc" },
      });
      return serializePrisma(eventTypes);
    },
    [`event-types-list-v3-${vendorId || "all"}`],
    { revalidate: 300, tags: ["event-types"] },
  )();
});

export const getServiceById = cache(async (id: string) => {
  const fetchService = async (serviceId: string) => {
    const startTime = performance.now();
    try {
      const prisma = getPrisma();

      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          vendorprofile: {
            select: {
              id: true,
              businessName: true,
              description: true,
              logo: true,
              coverImage: true,
              city: true,
              rating: true,
              reviewCount: true,
              verificationStatus: true,
              featured: true,
            }
          },
          portfolio: {
            select: {
              id: true,
              mediaUrl: true,
              mediaType: true,
              title: true,
            }
          },
          Renamedpackage: {
            include: {
              package_addon: true,
              pricingrule: true
            }
          },
          servicetype: {
            include: {
              subcategory: {
                include: {
                  category: {
                    include: {
                      eventtype: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: { review: true }
          }
        }
      });

      if (!service) return null;

      const duration = performance.now() - startTime;
      if (duration > 300) logger.info(`[PERF] getServiceById took ${duration.toFixed(2)}ms`, { serviceId });

      return serializePrisma(service);
    } catch (error) {
      logger.error("Error in getServiceById", { error, serviceId });
      throw error;
    }
  };

  return unstable_cache(() => fetchService(id), [`service-v1-${id}`], {
    revalidate: 3600,
    tags: [`service-${id}`, "services"],
  })();
});

export const getRelatedServices = cache(async (serviceId: string) => {
  const fetchRelated = async (id: string) => {
    try {
      const prisma = getPrisma();
      const currentService = await prisma.service.findUnique({
        where: { id },
        select: { serviceTypeId: true, vendorProfileId: true }
      });

      if (!currentService) return [];

      const related = await prisma.service.findMany({
        where: {
          serviceTypeId: currentService.serviceTypeId,
          id: { not: id },
          vendorprofile: { verificationStatus: 'APPROVED' }
        },
        take: 4,
        include: {
          vendorprofile: {
            select: { id: true, businessName: true, rating: true, city: true }
          },
          portfolio: { take: 1 }
        }
      });

      return serializePrisma(related);
    } catch (error) {
      logger.error("Error in getRelatedServices", { error, serviceId });
      return [];
    }
  };

  return unstable_cache(() => fetchRelated(serviceId), [`related-services-${serviceId}`], {
    revalidate: 3600,
    tags: ["services"],
  })();
});

export const getVendorById = cache(async (id: string) => {
  const fetchVendor = async (vendorId: string) => {
    const startTime = performance.now();
    try {
      const prisma = getPrisma();

      // Phase 2: Parallelize initial data fetching
      const vendorPromise = prisma.vendorprofile.findUnique({
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
                  inclusions: true,
                },
                take: 5,
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
                          name: true,
                          eventtype: {
                            select: {
                              id: true,
                              name: true
                            }
                          }
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          portfolio: {
            select: {
              id: true,
              mediaUrl: true,
              mediaType: true,
              title: true,
            },
            take: 10,
          },
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              customerprofile: {
                select: {
                  profileImage: true,
                  user: { select: { fullName: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          availability: {
            where: {
              date: { gte: new Date() },
            },
            take: 10,
            orderBy: { date: "asc" },
          },
        },
      });

      const vendor = await vendorPromise;

      if (!vendor) return null;

      // Phase 3: Optimize similar vendors query
      const primaryCategory = vendor.service?.[0]?.servicetype?.subcategory?.category?.name;
      let similarVendors: any[] = [];

      if (primaryCategory) {
        const rawSimilar = await prisma.vendorprofile.findMany({
          where: {
            id: { not: vendorId },
            verificationStatus: "APPROVED",
            service: {
              some: {
                servicetype: {
                  subcategory: {
                    category: { name: primaryCategory },
                  },
                },
              },
            },
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
              },
            },
          },
        });

        similarVendors = rawSimilar.map((v) => ({
          id: v.id,
          businessName: v.businessName,
          coverImage: v.coverImage,
          rating: v.rating ? Number(v.rating).toFixed(1) : "0.0",
          reviewCount: v.reviewCount || 0,
          basePrice: Number(v.service[0]?.basePrice || 0),
          city: v.city,
          featured: v.featured,
        }));
      }

      const duration = performance.now() - startTime;
      if (duration > 300) {
          logger.info(`[PERF] getVendorById took ${duration.toFixed(2)}ms`, { vendorId });
      }

      const result = { vendor, similarVendors };
      return serializePrisma(result);
    } catch (error) {
      logger.error("Error in getVendorById", { error, vendorId: id });
      throw error;
    }
  };

  return unstable_cache(() => fetchVendor(id), [`vendor-v2-${id}`], {
    revalidate: 3600,
    tags: [`vendor-${id}`, "vendors"],
  })();
});
