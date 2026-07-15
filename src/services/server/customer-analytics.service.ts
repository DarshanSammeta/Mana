import "server-only";
import { getPrisma } from "@/lib/prisma";
if (typeof window !== "undefined") { throw new Error("customer-analytics.service can only be used on the server."); }

export class CustomerAnalyticsService {
  static async getAnalytics(userId: string) {
    const prisma = getPrisma();
    const [bookings, wallet, reviews] = await Promise.all([
      prisma.booking.findMany({
        where: { customerId: userId },
        select: {
          totalAmount: true,
          status: true,
          createdAt: true,
          bookingitem: {
            include: {
              service: {
                include: {
                  servicetype: {
                    include: {
                      subcategory: {
                        include: {
                          category: true
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
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.review.count({ where: { userId } })
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
      loyaltyPoints: wallet?.balance || 0,
      reviewsWritten: reviews,
      favoriteCategory,
      spendingTrends: trends,
    };
  }
}
