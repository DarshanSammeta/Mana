import "server-only";
import { getPrisma } from "@/lib/prisma";
import { safeRedis } from "@/lib/redis";
import { getMeiliSearch, VENDORS_INDEX } from "@/lib/meilisearch";
import logger from "@/lib/logger";

if (typeof window !== "undefined") {
  throw new Error("recommendation.service can only be used on the server.");
}

export interface RecommendationContext {
  userId?: string;
  city?: string;
  eventType?: string;
  budget?: number;
  guestCount?: number;
  latitude?: number;
  longitude?: number;
  interests?: string[];
}

export class RecommendationService {
  private static CACHE_TTL = 3600; // 1 hour

  static async getRecommendations(context: RecommendationContext) {
    const cacheKey = `recommendations:${context.userId || 'guest'}:${context.city || 'all'}:${context.eventType || 'any'}:${context.budget || 'any'}`;

    try {
      const cached = await safeRedis.get(cacheKey);
      if (cached) return cached;
    } catch (err) {
      logger.error("Redis error in recommendations", err);
    }

    try {
      const prisma = getPrisma();
      // 1. Fetch User Profile Data
      let userHistory: any[] = [];
      let userWishlist: string[] = [];
      let userInterests: string[] = context.interests || [];

      if (context.userId) {
        const user = await prisma.user.findUnique({
          where: { id: context.userId },
          select: { interests: true }
        });
        if (user?.interests) {
          userInterests = [...userInterests, ...(user.interests as string[])];
        }

        userHistory = await prisma.recently_viewed.findMany({
          where: { userId: context.userId },
          take: 20,
          orderBy: { timestamp: 'desc' },
          select: { vendorId: true }
        });

        const wishlist = await prisma.wishlistitem.findMany({
          where: { wishlist: { userId: context.userId }, type: 'VENDOR' },
          select: { targetId: true }
        });
        userWishlist = wishlist.map(w => w.targetId);
      }

      // 2. Query Meilisearch for candidates
      const client = getMeiliSearch();
      if (!client) throw new Error("Meilisearch client not available");
      const index = client.index(VENDORS_INDEX);

      // Build filter
      const filters: string[] = [`verificationStatus = "APPROVED"`];
      if (context.city) filters.push(`city = "${context.city}"`);

      const searchResults = await index.search("", {
        filter: filters.length > 0 ? filters.join(" AND ") : undefined,
        limit: 100
      });

      const candidates = searchResults.hits;

      // 3. Weighted Scoring Algorithm
      const scoredVendors = candidates.map((v: any) => {
        let score = 0;

        // A. Performance & Quality (40%)
        score += (v.rating || 0) * 10; // Max 50
        score += Math.min((v.reviewCount || 0) / 10, 20); // Max 20
        score += Math.min((v.totalBookings || 0) / 5, 30); // Max 30

        // B. Personalization (30%)
        if (userHistory.some(h => h.vendorId === v.id)) score += 40; // Viewed recently
        if (userWishlist.includes(v.id)) score += 60; // In wishlist

        // Interest matching
        if (userInterests.length > 0 && v.categories) {
          const matchCount = v.categories.filter((cat: string) => userInterests.includes(cat)).length;
          score += matchCount * 15;
        }

        // C. Context & Relevance (30%)
        if (context.eventType && v.eventTypes?.includes(context.eventType)) score += 50;

        // Trending score (from Meilisearch or computed)
        score += (v.searchScore || 0) * 5;

        // Seasonality (Simplified logic)
        const month = new Date().getMonth();
        const isWeddingSeason = [10, 11, 0, 1].includes(month);
        if (isWeddingSeason && v.categories?.includes("Wedding")) score += 20;

        return { ...v, recommendationScore: score };
      });

      const finalRecommendations = scoredVendors
        .sort((a: any, b: any) => b.recommendationScore - a.recommendationScore)
        .slice(0, 15);

      await safeRedis.set(cacheKey, JSON.stringify(finalRecommendations), 3600);

      return finalRecommendations;
    } catch (error) {
      logger.error("Failed to generate recommendations", { error, context });
      return [];
    }
  }

  static async trackView(userId: string, vendorId: string, serviceId?: string) {
    try {
      const prisma = getPrisma();
      await prisma.recently_viewed.create({
        data: {
          userId,
          vendorId,
          serviceId,
          timestamp: new Date()
        }
      });

      // Maintain limit (e.g., 50 per user)
      const count = await prisma.recently_viewed.count({ where: { userId } });
      if (count > 50) {
        const oldest = await prisma.recently_viewed.findMany({
          where: { userId },
          orderBy: { timestamp: 'asc' },
          take: count - 50
        });
        await prisma.recently_viewed.deleteMany({
          where: { id: { in: oldest.map(o => o.id) } }
        });
      }
    } catch (e) {
      logger.error("Error tracking view", e);
    }
  }
}
