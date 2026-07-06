import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

interface HealthStatus {
  status: "OK" | "ERROR";
  timestamp: string;
  services: {
    database: "UP" | "DOWN" | "UNKNOWN";
    redis: "UP" | "DOWN" | "UNKNOWN";
  };
}

export async function GET() {
  const healthStatus: HealthStatus = {
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      database: "UNKNOWN",
      redis: "UNKNOWN",
    },
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database = "UP";
  } catch (_error) {
    console.error("[Health Check] Database down:", _error);
    healthStatus.services.database = "DOWN";
    healthStatus.status = "ERROR";
  }

  try {
    // Redis check - using ping directly but with a timeout
    // We don't use safeRedis here because we actually WANT to know if it's down
    if (typeof redis.ping === 'function') {
      const pingPromise = redis.ping();
      const _timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 500)
      );

      await Promise.race([pingPromise, _timeoutPromise]);
      healthStatus.services.redis = "UP";
    } else {
      healthStatus.services.redis = "DOWN";
    }
  } catch {
    // Redis being down shouldn't necessarily mark the whole app as ERROR
    // unless the user specifically wants it to. Given the requirement
    // "Redis must be OPTIONAL", we might just mark it as DOWN but status OK.
    healthStatus.services.redis = "DOWN";
    // Not marking healthStatus.status = "ERROR" if Redis is down since it's optional
  }

  const statusCode = healthStatus.status === "OK" ? 200 : 503;
  return NextResponse.json(healthStatus, { status: statusCode });
}
