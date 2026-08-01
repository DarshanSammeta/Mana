import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { startOfMonth, startOfDay, subDays } from "date-fns";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "SUPPORT_ADMIN", "CONTENT_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN"];

async function checkAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const payload = await verifyAccessToken(token);
  if (!payload || !ADMIN_ROLES.includes(payload.role?.toUpperCase())) return null;
  return payload;
}

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const now = new Date();
    const today = startOfDay(now);
    const monthStart = startOfMonth(now);
    const sevenDaysAgo = subDays(today, 7);

    const [
      totalUsers,
      totalVendors,
      activeVendors,
      pendingKyc,
      totalBookings,
      bookingsToday,
      ongoingEvents,
      completedEvents,
      cancelledEvents,
      revenueToday,
      revenueMonth,
      commissionMonth,
      pendingPayouts,
      activeSos,
      recentBookings,
      categorySplitData
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.vendorprofile.count(),
      prisma.vendorprofile.count({ where: { isActive: true } }),
      prisma.vendorprofile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: today } } }),
      prisma.booking.count({ where: { status: { in: ["CONFIRMED", "VENDOR_TRAVELING", "VENDOR_ARRIVED", "IN_PROGRESS", "EVENT_ONGOING"] } } }),
      prisma.booking.count({ where: { status: "EVENT_COMPLETED" } }),
      prisma.booking.count({ where: { status: "CANCELLED" } }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS", createdAt: { gte: today } },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS", createdAt: { gte: monthStart } },
        _sum: { amount: true }
      }),
      prisma.booking.aggregate({
        where: { status: "PAYMENT_RELEASED", updatedAt: { gte: monthStart } },
        _sum: { commissionAmount: true }
      }),
      prisma.vendor_payout.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true }
      }),
      prisma.booking.count({ where: { status: "EMERGENCY" } }), // Placeholder for active SOS
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          customerprofile: { include: { user: { select: { fullName: true } } } },
          vendorprofile: { select: { businessName: true } },
        }
      }),
      prisma.category.findMany({
        include: { _count: { select: { vendorprofile: true } } }
      })
    ]);

    // Generate 7-day revenue series
    const revenueHistory = await prisma.payment.findMany({
      where: {
        status: "SUCCESS",
        createdAt: { gte: sevenDaysAgo }
      },
      select: { amount: true, createdAt: true }
    });

    const revenueSeries = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(today, 6 - i);
      const dayStr = d.toLocaleDateString("en-US", { weekday: "short" });
      const amount = revenueHistory
        .filter(p => startOfDay(p.createdAt).getTime() === startOfDay(d).getTime())
        .reduce((sum, p) => sum + Number(p.amount), 0);
      return { day: dayStr, revenue: amount };
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalVendors,
        activeVendors,
        pendingKyc,
        totalBookings,
        bookingsToday,
        ongoingEvents,
        completedEvents,
        cancelledEvents,
        revenueToday: Number(revenueToday._sum.amount || 0),
        revenueMonth: Number(revenueMonth._sum.amount || 0),
        commissionMonth: Number(commissionMonth._sum.commissionAmount || 0),
        pendingPayouts: Number(pendingPayouts._sum.amount || 0),
        activeSos
      },
      revenueSeries,
      categorySplit: categorySplitData.map(c => ({
        name: c.name,
        value: c._count.vendorprofile
      })),
      recentBookings: recentBookings.map(b => ({
        id: b.id,
        total: Number(b.totalAmount),
        status: b.status.toLowerCase(),
        eventDate: b.eventDate,
        customer: { user: { name: b.customerprofile.user.fullName } },
        Vendor: { businessName: b.vendorprofile?.businessName || "—" },
        Service: { name: b.eventType || "Service" }
      }))
    });
  }, req);
}
