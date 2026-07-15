import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { meiliClient } from "@/lib/meilisearch";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      activeBookings,
      totalRevenue,
      todayBookings,
      errorLogs,
      recentPayments
    ] = await Promise.all([
      prisma.booking.count({
        where: { status: { in: ["CONFIRMED", "VENDOR_ASSIGNED", "EVENT_STARTED", "EVENT_ONGOING"] } }
      }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true }
      }),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.auditlog.count({
        where: {
          action: { contains: "ERROR" },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { booking: { select: { bookingNumber: true } } }
      })
    ]);

    const dashboardData = {
      realtime: {
        liveUsers: await redis?.scard("active_sessions") || 0,
        onlineVendors: await redis?.scard("online_vendors") || 0,
        activeBookings,
      },
      finance: {
        totalRevenue: totalRevenue._sum.amount || 0,
        todayBookings,
        recentPayments: recentPayments.map(p => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          booking: p.booking.bookingNumber,
          time: p.createdAt
        }))
      },
      health: {
        cpu: os.loadavg()[0],
        memory: (1 - os.freemem() / os.totalmem()) * 100,
        errors24h: errorLogs,
        services: {
          db: "CONNECTED",
          redis: redis ? "CONNECTED" : "DISCONNECTED",
          meili: (await meiliClient?.isHealthy()) ? "HEALTHY" : "UNHEALTHY"
        }
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Ops Dashboard Data Error:", error);
    return NextResponse.json({ error: "Failed to load operations data" }, { status: 500 });
  }
}
