import "server-only";
import { getMeiliSearch, VENDORS_INDEX } from "@/lib/meilisearch";
import { safeRedis } from "@/lib/redis";
import logger from "@/lib/logger";

if (typeof window !== "undefined") {
  throw new Error("PricingInsightsService can only be used on the server.");
}

export interface VendorHit {
  id: string;
  businessName: string;
  avgPrice: number;
  rating: number;
  reviewCount: number;
  totalBookings: number;
  logo?: string;
}

export interface PricingInsights {
  averageMarketPrice: number;
  bestValue: VendorHit[];
  premiumVendors: VendorHit[];
  budgetVendors: VendorHit[];
  popularChoice: VendorHit[];
}

export class PricingInsightsService {
  private static CACHE_KEY = "pricing:insights";

  static async getInsights(city?: string, category?: string): Promise<PricingInsights> {
    const cacheKey = `${this.CACHE_KEY}:${city || "global"}:${category || "all"}`;

    const cached = await safeRedis.get(cacheKey);
    if (cached) {
      return (typeof cached === 'string' ? JSON.parse(cached) : cached) as PricingInsights;
    }

    try {
      const client = getMeiliSearch();
      if (!client) throw new Error("Meilisearch client not available");
      const index = client.index(VENDORS_INDEX);

      const filters: string[] = [];
      if (city) filters.push(`city = "${city}"`);
      if (category) filters.push(`categories = "${category}"`);

      // 1. Get all relevant vendors to calculate averages
      const results = await index.search("", {
        filter: filters.length > 0 ? filters.join(" AND ") : undefined,
        limit: 1000,
        attributesToRetrieve: ["id", "businessName", "avgPrice", "rating", "reviewCount", "totalBookings", "logo"]
      });

      const hits = results.hits as unknown as VendorHit[];
      if (hits.length === 0) {
        return {
          averageMarketPrice: 0,
          bestValue: [],
          premiumVendors: [],
          budgetVendors: [],
          popularChoice: []
        };
      }

      const prices = hits.map((h: VendorHit) => h.avgPrice).filter((p: number) => p > 0);
      const avgMarketPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0;

      // 2. Best Value (High Rating, Lower than Average Price)
      const bestValue = hits
        .filter((h: VendorHit) => h.rating >= 4 && h.avgPrice <= avgMarketPrice && h.avgPrice > 0)
        .sort((a: VendorHit, b: VendorHit) => b.rating - a.rating)
        .slice(0, 5);

      // 3. Premium Vendors (Top 10% by Price and High Rating)
      const premiumVendors = hits
        .filter((h: VendorHit) => h.avgPrice > avgMarketPrice * 1.5)
        .sort((a: VendorHit, b: VendorHit) => b.avgPrice - a.avgPrice)
        .slice(0, 5);

      // 4. Budget Vendors (Bottom 25% by Price)
      const budgetVendors = hits
        .filter((h: VendorHit) => h.avgPrice > 0 && h.avgPrice < avgMarketPrice * 0.7)
        .sort((a: VendorHit, b: VendorHit) => a.avgPrice - b.avgPrice)
        .slice(0, 5);

      // 5. Popular Choice (Most Bookings/Reviews)
      const popularChoice = hits
        .sort((a: VendorHit, b: VendorHit) => (b.totalBookings + b.reviewCount) - (a.totalBookings + a.reviewCount))
        .slice(0, 5);

      const insights = {
        averageMarketPrice: Math.round(avgMarketPrice),
        bestValue,
        premiumVendors,
        budgetVendors,
        popularChoice
      };

      await safeRedis.set(cacheKey, JSON.stringify(insights), 3600 * 6); // Cache for 6 hours

      return insights;
    } catch (error) {
      logger.error("Failed to calculate pricing insights", error);
      throw error;
    }
  }
}
