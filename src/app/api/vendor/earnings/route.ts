import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      include: {
        user: {
          include: {
            wallet: {
              include: {
                transaction: {
                  take: 20,
                  orderBy: { createdAt: "desc" },
                }
              }
            }
          }
        }
      }
    });

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    const wallet = vendorProfile.user.wallet;

    // Monthly revenue calculation
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyEarnings = await prisma.transaction.aggregate({
      where: {
        walletId: wallet?.id,
        type: 'CREDIT',
        createdAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });

    const payouts = await prisma.payout.findMany({
      where: { vendorId: vendorProfile.id },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    return NextResponse.json({
      summary: {
        totalRevenue: Number(wallet?.lifetimeEarnings || 0),
        pendingRevenue: Number(wallet?.pendingBalance || 0),
        withdrawableRevenue: Number(wallet?.withdrawable || 0),
        monthlyRevenue: Number(monthlyEarnings._sum.amount || 0),
      },
      transactions: wallet?.transaction || [],
      payouts: payouts,
      bankDetails: vendorProfile.bankDetails
    });
  } catch (error: any) {
    console.error("Earnings API Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
