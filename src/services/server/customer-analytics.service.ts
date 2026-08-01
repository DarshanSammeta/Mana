import "server-only";
import { getPrisma } from "@/lib/prisma";
if (typeof window !== "undefined") { throw new Error("customer-analytics.service can only be used on the server."); }

export class CustomerAnalyticsService {
  /**
   * Gets analytics for a customer based on their userId
   */
  static async getAnalytics(userId: string) {
    const prisma = getPrisma();

    // First get the customer profile
    const profile = await prisma.customerprofile.findUnique({
      where: { userId },
      select: { id: true, loyaltyPoints: true }
    });

    if (!profile) {
      return {
        totalBookings: 0,
        completedBookings: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        loyaltyPoints: 0,
        reviewsWritten: 0,
        favoriteCategory: "None",
        spendingTrends: [],
      };
    }

    const [bookings, reviews] = await Promise.all([
      prisma.booking.findMany({
        where: { customerProfileId: profile.id },
        select: {
          totalAmount: true,
          status: true,
          createdAt: true,
          bookingitem: {
            select: {
              service: {
                select: {
                  servicetype: {
                    select: {
                      subcategory: {
                        select: {
                          category: {
                            select: { name: true }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.review.count({ where: { customerProfileId: profile.id } })
    ]);

    const totalSpent = bookings
      .filter(b => b.status === "EVENT_COMPLETED")
      .reduce((acc, b) => acc + Number(b.totalAmount), 0);

    const categoryCounts: Record<string, number> = {};
    bookings.forEach(b => {
      b.bookingitem.forEach(item => {
        const cat = item.service.servicetype.subcategory.category.name;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    });

    const favoriteCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

    // Monthly trends (last 6 months)
    const months = 6;
    const trends = [];
    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      const monthSpend = bookings
        .filter(b => b.createdAt.getMonth() === d.getMonth() && b.createdAt.getFullYear() === d.getFullYear())
        .reduce((acc, b) => acc + Number(b.totalAmount), 0);

      trends.unshift({ month: monthLabel, spend: monthSpend });
    }

    return {
      totalBookings: bookings.length,
      completedBookings: bookings.filter(b => b.status === "EVENT_COMPLETED").length,
      totalSpent,
      averageOrderValue: bookings.length > 0 ? totalSpent / bookings.length : 0,
      loyaltyPoints: profile.loyaltyPoints,
      reviewsWritten: reviews,
      favoriteCategory,
      spendingTrends: trends,
    };
  }
}
