import { safeRedis } from "@/lib/redis";
import "server-only";
import { getPrisma } from "@/lib/prisma";
if (typeof window !== "undefined") { throw new Error("search-intelligence.service can only be used on the server."); }
import logger from "@/lib/logger";

export class SearchIntelligenceService {
  private static TRENDING_KEY = "search:trending";
  private static POPULAR_QUERIES_KEY = "search:popular";

  static async trackSearch(query: string, userId?: string, filters?: any, resultsCount: number = 0) {
    const prisma = getPrisma();
    try {
      // 1. Increment popular search count
      if (query.length > 2) {
        await safeRedis.zincrby(this.POPULAR_QUERIES_KEY, 1, query.toLowerCase().trim());
        await safeRedis.zincrby(this.TRENDING_KEY, 1, query.toLowerCase().trim());
      }

      // 2. Log to Database for long-term analytics
      await prisma.search_analytics.create({
        data: {
          query,
          userId,
          category: filters?.category,
          city: filters?.city,
          latitude: filters?.latitude,
          longitude: filters?.longitude,
        }
      });

      // 3. Track No-Result searches
      if (resultsCount === 0) {
        await safeRedis.zincrby("search:no_results", 1, query.toLowerCase().trim());
      }
    } catch (error) {
      logger.error("Search tracking failed", { error, query });
    }
  }

  static async getTrendingKeywords(limit = 10) {
    const keywords = await safeRedis.zrevrange(this.TRENDING_KEY, 0, limit - 1);
    return keywords;
  }

  static async getPopularSearches(limit = 10) {
    const keywords = await safeRedis.zrevrange(this.POPULAR_QUERIES_KEY, 0, limit - 1);
    return keywords;
  }

  static async trackClick(query: string, vendorId: string, _position: number) {
    const key = `search:ctr:${vendorId}`;
    // Since safeRedis doesn't have hincrby yet, and we are moving towards safety,
    // we should ideally add it to safeRedis if needed.
    // For now, let's just ensure we use getRedis() or add it to safeRedis.
    // Given the task, let's stick to getRedis() if we must use raw methods, but prefer safeRedis.
    // Let's add hincrby to safeRedis later or use a workaround.
    // Actually, I'll just use safeRedis if it had it.
    // I will use getRedis() directly here with a check.
    const redis = (await import("@/lib/redis")).getRedis();
    if (redis) {
      await redis.hincrby(key, "clicks", 1);
      await redis.hincrby(`search:query_clicks:${query}`, vendorId, 1);
    }
  }
}
