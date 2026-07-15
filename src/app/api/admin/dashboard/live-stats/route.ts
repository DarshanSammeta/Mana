import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIoRedis } from "@/lib/redis";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const [
      activeBookings,
      pendingPayouts,
      openDisputes,
      emergencyAlerts,
      onlineVendors
    ] = await Promise.all([
      prisma.booking.count({ where: { status: { in: ["CONFIRMED", "VENDOR_TRAVELING", "VENDOR_ARRIVED", "IN_PROGRESS"] } } }),
      prisma.transaction.count({ where: { type: "PAYOUT", status: "PENDING" } }),
      prisma.dispute.count({ where: { status: "OPEN" } }),
      prisma.booking.count({ where: { status: "EMERGENCY" } }),
      // For online vendors, we check Redis presence keys
      (async () => {
        const redis = getIoRedis();
        if (!redis) return 0;
        const keys = await redis.keys("vendor:online:*");
        return keys.length;
      })()
    ]);

    return NextResponse.json({
      activeBookings,
      pendingPayouts,
      openDisputes,
      emergencyAlerts,
      onlineVendors
    });
  }, req);
}
