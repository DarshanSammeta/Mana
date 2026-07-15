import "server-only";
import { getPrisma } from "@/lib/prisma";

export class AnalyticsService {
  /**
   * Captures search intent for business intelligence
   */
  static async logSearch(userId: string | null, criteria: {
    query?: string;
    city?: string;
    category?: string;
    eventType?: string;
    budgetRange?: string;
  }) {
    const prisma = getPrisma();
    await prisma.search_analytics.create({
      data: {
        userId,
        query: criteria.query,
        city: criteria.city,
        category: criteria.category,
        createdAt: new Date()
      }
    });
  }

  /**
   * Gets popular services and cities for admin dashboards
   */
  static async getPopularInsights() {
    const prisma = getPrisma();

    const [popularCategories, popularCities] = await Promise.all([
        prisma.search_analytics.groupBy({
            by: ['category'],
            _count: { category: true },
            orderBy: { _count: { category: 'desc' } },
            take: 5
        }),
        prisma.search_analytics.groupBy({
            by: ['city'],
            _count: { city: true },
            orderBy: { _count: { city: 'desc' } },
            take: 5
        })
    ]);

    return { popularCategories, popularCities };
  }
}
