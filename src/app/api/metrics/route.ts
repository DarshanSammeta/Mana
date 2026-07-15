import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { meiliClient } from "@/lib/meilisearch";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Collect Business Metrics
    const [
      totalUsers,
      totalVendors,
      totalBookings,
      pendingBookings,
      completedBookings,
      totalRevenue,
      totalPayments,
      failedPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vendorprofile.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "EVENT_COMPLETED" } }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { status: "SUCCESS" } }),
      prisma.payment.count({ where: { status: "FAILED" } }),
    ]);

    // System Metrics from Redis
    let cacheHitRate = 0;
    let activeSessions = 0;
    if (redis) {
      const stats = await redis.get("stats:cache_hits"); // Assuming these are tracked
      cacheHitRate = Number(stats) || 0;
      // Active users/sessions could be tracked in Redis sets
      activeSessions = await redis.scard("active_sessions") || 0;
    }

    // Search Metrics from Meilisearch (if possible)
    let searchHealth = false;
    if (meiliClient) {
      searchHealth = await meiliClient.isHealthy();
    }

    const metrics = {
      timestamp: new Date().toISOString(),
      business: {
        users: { total: totalUsers },
        vendors: { total: totalVendors },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          completed: completedBookings,
          successRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(2) + "%" : "0%",
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          currency: "INR",
        },
        payments: {
          success: totalPayments,
          failed: failedPayments,
          failureRate: (totalPayments + failedPayments) > 0
            ? ((failedPayments / (totalPayments + failedPayments)) * 100).toFixed(2) + "%"
            : "0%",
        }
      },
      infrastructure: {
        database: "CONNECTED",
        redis: redis ? "CONNECTED" : "DISCONNECTED",
        meilisearch: searchHealth ? "HEALTHY" : "UNHEALTHY",
        cache: {
          hitRate: cacheHitRate,
        },
        sessions: {
          active: activeSessions,
        }
      }
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
