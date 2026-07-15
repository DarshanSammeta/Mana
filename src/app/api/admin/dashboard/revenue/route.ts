import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ status: 403 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [revenue, pendingPayouts, growth] = await Promise.all([
      prisma.payment.aggregate({
        where: {
            status: "COMPLETED",
            createdAt: { gte: today }
        },
        _sum: { amount: true }
      }),
      prisma.vendor_payout.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true }
      }),
      prisma.user.count({
        where: { createdAt: { gte: today } }
      })
    ]);

    return NextResponse.json({
      todayRevenue: revenue._sum.amount || 0,
      pendingPayouts: pendingPayouts._sum.amount || 0,
      newUsersToday: growth,
      currency: "INR"
    });
  }, req);
}
