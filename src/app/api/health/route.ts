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
    // Redis check - using ping directly via REST
    if (redis) {
      const result = await redis.ping();
      healthStatus.services.redis = result === "PONG" ? "UP" : "DOWN";
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
