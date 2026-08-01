import "server-only";
import { getPrisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface RankingWeights {
  distance: number;
  performance: number;
  responsiveness: number;
  reliability: number;
  price: number;
  premium: number;
}

export interface RankingScore {
  totalScore: number;
  factors: {
    distance: number;
    performance: number;
    responsiveness: number;
    reliability: number;
    price: number;
    premium: number;
  };
  reasons: string[];
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  distance: 0.30,
  performance: 0.25,
  responsiveness: 0.15,
  reliability: 0.15,
  price: 0.10,
  premium: 0.05
};

export class VendorRankingService {
  /**
   * Calculates a weighted enterprise ranking score for a vendor.
   */
  static async calculateScore(
    vendor: any,
    context: { lat?: number; lng?: number; categoryAvgPrice?: number } = {},
    weights: RankingWeights = DEFAULT_WEIGHTS
  ): Promise<RankingScore> {
    const reasons: string[] = [];
    const scores = {
      distance: 0,
      performance: 0,
      responsiveness: 0,
      reliability: 0,
      price: 0,
      premium: 0
    };

    // 1. Distance Score (0-100)
    if (context.lat && context.lng && vendor.latitude && vendor.longitude) {
      const dist = this.getDistance(context.lat, context.lng, vendor.latitude, vendor.longitude);
      // Normalized: 100 for <5km, decaying to 0 at 50km
      scores.distance = Math.max(0, 100 - (dist * 2));
      if (dist < 5) reasons.push("Very close to event location");
    } else {
      scores.distance = 50; // Neutral if no location
    }

    // 2. Performance Score (0-100)
    // Formula: (Rating * 15) + (CompletionRate * 0.25)
    const ratingBoost = (vendor.rating || 0) * 20; // 5.0 -> 100
    const completionBoost = (vendor.completionRate || 0); // 100% -> 100
    scores.performance = (ratingBoost * 0.6) + (completionBoost * 0.4);
    if (vendor.rating > 4.5) reasons.push("Top rated professional");
    if (vendor.completionRate > 95) reasons.push("Highly reliable completion track record");

    // 3. Responsiveness Score (0-100)
    // Formula: (Inverse of ResponseTime) + AcceptanceRate
    // ResponseTime is in hours. 1h -> 100, 24h -> 0
    const responseScore = Math.max(0, 100 - ((vendor.responseTime || 24) * 4));
    // Acceptance rate is placeholder for now (would need query from assignments)
    const acceptanceRate = 80; // Default placeholder
    scores.responsiveness = (responseScore * 0.7) + (acceptanceRate * 0.3);
    if (vendor.responseTime < 2) reasons.push("Responds almost instantly");

    // 4. Reliability Score (0-100)
    // Based on Total Bookings and Repeat Rate
    const popularity = Math.min((vendor.totalBookings || 0) * 2, 100);
    scores.reliability = popularity;
    if (vendor.totalBookings > 50) reasons.push("Highly experienced on the platform");

    // 5. Price Competitiveness (0-100)
    if (context.categoryAvgPrice && vendor.basePrice) {
      const ratio = vendor.basePrice / context.categoryAvgPrice;
      if (ratio < 0.9) {
          scores.price = 100;
          reasons.push("Extremely competitive pricing");
      } else if (ratio < 1.1) {
          scores.price = 80;
          reasons.push("Fair market pricing");
      } else {
          scores.price = 50;
      }
    } else {
      scores.price = 70;
    }

    // 6. Premium Bonus
    if (vendor.featured) {
        scores.premium += 100;
        reasons.push("Featured Premium Partner");
    }
    if (vendor.verificationStatus === 'APPROVED') {
        scores.premium += 50;
    }
    scores.premium = Math.min(scores.premium, 100);

    // Final Weighted Calculation
    const totalScore =
      (scores.distance * weights.distance) +
      (scores.performance * weights.performance) +
      (scores.responsiveness * weights.responsiveness) +
      (scores.reliability * weights.reliability) +
      (scores.price * weights.price) +
      (scores.premium * weights.premium);

    return {
      totalScore: Math.round(totalScore),
      factors: scores,
      reasons: reasons.slice(0, 3)
    };
  }

  private static getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Helper to get average price for a category to help calculate price score.
   */
  static async getCategoryAveragePrice(categoryId: string): Promise<number> {
    return unstable_cache(
      async () => {
        const prisma = getPrisma();
        const result: any = await prisma.$queryRaw`
          SELECT AVG("basePrice")::float as avg
          FROM service
          WHERE "serviceTypeId" IN (
            SELECT id FROM servicetype WHERE "subcategoryId" IN (
                SELECT id FROM subcategory WHERE "categoryId" = ${categoryId}
            )
          )
        `;
        return result[0]?.avg || 0;
      },
      [`category-avg-price-${categoryId}`],
      { revalidate: 3600, tags: ['pricing', `category-${categoryId}`] }
    )();
  }
}
