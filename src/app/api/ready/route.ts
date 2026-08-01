import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * Lightweight Readiness Probe
 * Used by load balancers to determine if the instance is ready to serve traffic.
 */
export async function GET() {
  try {
    const checks = [];

    // 1. Database Connectivity
    checks.push(prisma.$queryRaw`SELECT 1`);

    // 2. Redis Connectivity (If configured)
    if (redis) {
      checks.push(redis.ping());
    }

    await Promise.all(checks);

    return NextResponse.json({ status: "READY" }, { status: 200 });
  } catch (error: any) {
    // Log failure but do not expose stack trace
    console.error("[Readiness Probe] FAILED:", error.message);

    return NextResponse.json(
      { status: "NOT READY" },
      { status: 503 }
    );
  }
}
