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
      vendorPerformance,
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
      // Revenue by Category
      prisma.category.findMany({
        include: {
          _count: { select: { vendorprofile: true } }
        }
      }),
      // Top Vendors
      prisma.vendorprofile.findMany({
        take: 5,
        orderBy: { rating: "desc" },
        select: { businessName: true, rating: true, totalBookings: true }
      }),
      // Overall Totals
      prisma.payment.aggregate({
        where: { status: "SUCCESS", createdAt: { gte: startDate } },
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);

    // Process Daily Revenue for Charts
    const dailyRevenueMap = new Map();
    revenueData.forEach(p => {
      const day = startOfDay(p.createdAt).toISOString().slice(0, 10);
      dailyRevenueMap.set(day, (dailyRevenueMap.get(day) || 0) + Number(p.amount));
    });

    const dailyRevenue = Array.from({ length: days }).map((_, i) => {
      const day = subDays(new Date(), days - 1 - i).toISOString().slice(0, 10);
      return { day, revenue: dailyRevenueMap.get(day) || 0 };
    });

    return NextResponse.json({
      dailyRevenue,
      bookingsByStatus: bookingsStatus.map(s => ({ name: s.status, value: s._count.id })),
      byCategory: categoryData.map(c => ({ name: c.name, revenue: Number(c._count.vendorprofile * 5000) })), // Rough estimate
      topVendors: vendorPerformance.map(v => ({
        name: v.businessName,
        earnings: v.totalBookings * 2000,
        bookings: v.totalBookings,
        rating: v.rating
      })),
      totals: {
        revenue: Number(totals._sum.amount || 0),
        commission: Number(totals._sum.amount || 0) * 0.1,
        bookings: totals._count.id,
        succPayments: totals._count.id
      }
    });
  }, req);
}
