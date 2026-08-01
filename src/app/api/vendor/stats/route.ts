import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const vendor = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: {
        id: true,
        user: {
          select: {
            wallet: {
              select: {
                id: true,
                lifetimeEarnings: true,
                pendingBalance: true,
                withdrawable: true,
              }
            }
          }
        },
        _count: {
          select: { booking: true }
        }
      }
    });

    if (!vendor) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    const wallet = vendor.user.wallet;

    // Monthly revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parallelize queries for better performance
    const [monthlyRevenue, dailyRevenue] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          walletId: wallet?.id,
          type: 'CREDIT',
          createdAt: { gte: startOfMonth }
        },
        _sum: {
          amount: true
        }
      }),
      prisma.$queryRaw`
        SELECT
          DATE("createdAt") as date,
          SUM(amount) as amount
        FROM "transaction"
        WHERE "walletId" = ${wallet?.id}
          AND type = 'CREDIT'
          AND "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC
      `
    ]);

    const stats = {
      totalRevenue: Number(wallet?.lifetimeEarnings || 0),
      pendingRevenue: Number(wallet?.pendingBalance || 0),
      withdrawableRevenue: Number(wallet?.withdrawable || 0),
      totalBookings: vendor._count.booking,
      monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
      dailyRevenue: (dailyRevenue as any[]).map(d => ({
        date: d.date.toISOString().split('T')[0],
        amount: Number(d.amount)
      }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.error("Stats API Error", { error });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}
