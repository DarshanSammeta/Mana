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
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database = "UP";
  } catch {
    healthStatus.services.database = "DOWN";
    healthStatus.status = "ERROR";
  }

  try {
    await redis.ping();
    healthStatus.services.redis = "UP";
  } catch {
    healthStatus.services.redis = "DOWN";
    healthStatus.status = "ERROR";
  }

  const statusCode = healthStatus.status === "OK" ? 200 : 503;
  return NextResponse.json(healthStatus, { status: statusCode });
}
