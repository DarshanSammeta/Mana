import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { Prisma } from "@prisma/client";

const TRENDING_SEARCHES_KEY = 'trending_searches';
const SEARCH_DEMAND_GEOSPATIAL_KEY = 'search_demand_geo';

export interface SearchTrackData {
  query?: string;
  category?: string;
  city?: string;
  lat?: number;
  lng?: number;
  userId?: string;
}

export async function trackSearch(data: SearchTrackData) {
  const { query, category, city, lat, lng, userId } = data;

  try {
    // 1. Track Query Popularity (Redis Sorted Set)
    if (query && query.length >= 2) {
      await redis.zincrby(TRENDING_SEARCHES_KEY, 1, query.toLowerCase().trim());
    }

    // 2. Track Category Demand
    if (category) {
      await redis.zincrby(`demand:category:${city || 'global'}`, 1, category);
    }

    // 3. Track Geospatial Demand for Heatmaps (Redis Geo)
    if (lat && lng) {
      // We store search events with a TTL or in a way that we can aggregate
      // For a heatmap, we might want to store counts in a grid or just raw points for a period
      await redis.geoadd(SEARCH_DEMAND_GEOSPATIAL_KEY, lng, lat, `${Date.now()}:${category || 'general'}`);

      // Also store in Postgres for long-term analytics and complex heatmaps
      await prisma.search_analytics.create({
        data: {
          query: query || null,
          category: category || null,
          city: city || null,
          latitude: lat,
          longitude: lng,
          userId: userId || null,
        }
      }).catch(err => logger.error("Failed to persist search analytics to PG", err));
    }
  } catch (error) {
    logger.error("Error tracking search analytics", { error, data });
  }
}

export async function getTrendingSearches(limit: number = 5) {
  const trending = await redis.zrevrange(TRENDING_SEARCHES_KEY, 0, limit - 1);
  return trending;
}

export async function getSearchHeatmap(category?: string, city?: string) {
  // This aggregates data from Postgres
  const whereConditions = [Prisma.sql`"createdAt" > NOW() - INTERVAL '30 days'`];
  if (category) whereConditions.push(Prisma.sql`category = ${category}`);
  if (city) whereConditions.push(Prisma.sql`city = ${city}`);

  const where = Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`;

  return await prisma.$queryRaw`
    SELECT
      ROUND(latitude::numeric, 3) as lat,
      ROUND(longitude::numeric, 3) as lng,
      COUNT(*)::int as weight
    FROM "search_analytics"
    ${where}
    GROUP BY ROUND(latitude::numeric, 3), ROUND(longitude::numeric, 3)
  `;
}
