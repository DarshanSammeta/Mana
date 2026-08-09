import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { subDays, startOfDay } from "date-fns";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = subDays(new Date(), days);

    const [
      revenueData,
      bookingsStatus,
      categoryData,
      categoryList,
      vendorData,
      totals
    ] = await Promise.all([
      // Daily Revenue
      prisma.payment.findMany({
        where: { status: "SUCCESS", createdAt: { gte: startDate } },
        select: { amount: true, createdAt: true }
      }),
      // Bookings by Status
      prisma.booking.groupBy({
        by: ["status"],
        _count: { id: true },
        where: { createdAt: { gte: startDate } }
      }),
      // Revenue by Category (Real Aggregation)
      prisma.booking.findMany({
        where: {
          createdAt: { gte: startDate },
          payment: { some: { status: "SUCCESS" } }
        },
        select: {
          categoryId: true,
          payment: {
            where: { status: "SUCCESS" },
            select: { amount: true }
          }
        }
      }),
      // Category Names for Lookup
      prisma.category.findMany({
        select: {
          id: true,
          name: true
        }
      }),
      // Top Vendors by Earnings (Real Aggregation)
      prisma.vendorprofile.findMany({
        select: {
          businessName: true,
          rating: true,
          booking: {
            where: {
              createdAt: { gte: startDate },
              payment: { some: { status: "SUCCESS" } }
            },
            select: {
              payment: {
                where: { status: "SUCCESS" },
                select: { amount: true }
              }
            }
          }
        }
      }),
      // Overall Totals
      prisma.payment.aggregate({
        where: { status: "SUCCESS", createdAt: { gte: startDate } },
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);

    // 1. Process Daily Revenue for Charts
    const dailyRevenueMap = new Map();
    revenueData.forEach(p => {
      const day = startOfDay(p.createdAt).toISOString().slice(0, 10);
      dailyRevenueMap.set(day, (dailyRevenueMap.get(day) || 0) + Number(p.amount));
    });

    const dailyRevenue = Array.from({ length: days }).map((_, i) => {
      const day = subDays(new Date(), days - 1 - i).toISOString().slice(0, 10);
      return { day, revenue: dailyRevenueMap.get(day) || 0 };
    });

    // 2. Process Category Revenue
    const categoryNameMap = new Map(
      categoryList.map(category => [category.id, category.name])
    );

    const categoryMap = new Map();
    categoryData.forEach(b => {
      const name = b.categoryId
        ? categoryNameMap.get(b.categoryId) || "Uncategorized"
        : "Uncategorized";
      const revenue = b.payment.reduce((sum, p) => sum + Number(p.amount), 0);
      const existing = categoryMap.get(name) || { count: 0, revenue: 0 };
      categoryMap.set(name, {
        count: existing.count + 1,
        revenue: existing.revenue + revenue
      });
    });

    const byCategory = Array.from(categoryMap.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      revenue: stats.revenue
    }));

    // 3. Process Top Vendors (Sorted by Earnings)
    const topVendors = vendorData
      .map(v => ({
        name: v.businessName,
        rating: v.rating,
        bookings: v.booking.length,
        earnings: v.booking.reduce((sum, b) =>
          sum + b.payment.reduce((pSum, p) => pSum + Number(p.amount), 0), 0)
      }))
      .filter(v => v.earnings > 0)
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    return NextResponse.json({
      dailyRevenue,
      bookingsByStatus: bookingsStatus.map(s => ({ name: s.status, value: s._count.id })),
      byCategory,
      topVendors,
      totals: {
        revenue: Number(totals._sum.amount || 0),
        commission: Number(totals._sum.amount || 0) * 0.1, // 10% Platform Fee
        bookings: totals._count.id,
        succPayments: totals._count.id
      }
    });
  }, req);
}
