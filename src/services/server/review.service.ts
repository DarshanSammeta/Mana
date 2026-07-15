import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export class ReviewService {
  /**
   * Recalculate vendor's weighted rating
   */
  static async updateVendorRating(vendorId: string) {
    const reviews = await prisma.review.findMany({
      where: { vendorId },
      select: { rating: true, isVerified: true, createdAt: true }
    });

    if (reviews.length === 0) return;

    let totalWeight = 0;
    let weightedSum = 0;

    const now = new Date();
    const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));

    for (const review of reviews) {
      let weight = 1.0;

      // Verified booking bonus
      if (review.isVerified) weight += 0.5;

      // Recency weight (decay older reviews)
      if (review.createdAt < sixMonthsAgo) weight *= 0.7;

      weightedSum += Number(review.rating) * weight;
      totalWeight += weight;
    }

    const averageRating = weightedSum / totalWeight;

    await prisma.vendorprofile.update({
      where: { id: vendorId },
      data: {
        rating: averageRating,
        reviewCount: reviews.length
      }
    });

    logger.info(`Updated rating for vendor ${vendorId}: ${averageRating.toFixed(2)}`);
  }

  /**
   * Mark a review as helpful
   */
  static async voteHelpful(reviewId: string, _userId: string) {
    // Add logic to track individual votes to prevent duplicates
    return await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 }
      }
    });
  }

  /**
   * Basic spam detection for reviews
   */
  static async detectSpam(text: string): Promise<boolean> {
    const spamPatterns = [/buy/i, /cheap/i, /offer/i, /http/i, /www/i];
    return spamPatterns.some(pattern => pattern.test(text));
  }
}
