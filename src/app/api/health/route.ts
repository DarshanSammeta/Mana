import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { meiliClient } from "@/lib/meilisearch";
import os from "os";

interface ServiceHealth {
  status: "UP" | "DOWN" | "UNKNOWN";
  latency?: number;
}

interface HealthStatus {
  status: "OK" | "ERROR" | "DEGRADED";
  timestamp: string;
  version: string;
  commit?: string;
  environment: string;
  uptime: number;
  responseTime?: number;
  system: {
    memory: {
      total: string;
      free: string;
      usage: string;
      process: string;
    };
    cpu: {
      load: number[];
      cores: number;
    };
    disk: {
      free?: string;
      total?: string;
    };
  };
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    meilisearch: ServiceHealth;
    socket: ServiceHealth;
    inngest: ServiceHealth;
    cloudinary: ServiceHealth;
    resend: ServiceHealth;
    twilio: ServiceHealth;
  };
}

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  const healthStatus: HealthStatus = {
    status: "OK",
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    commit: process.env.NEXT_PUBLIC_GIT_COMMIT || "unknown",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    system: {
      memory: {
        total: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usage: `${((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)}%`,
        process: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      },
      cpu: {
        load: os.loadavg(),
        cores: os.cpus().length,
      },
      disk: {},
    },
    services: {
      database: { status: "UNKNOWN" },
      redis: { status: "UNKNOWN" },
      meilisearch: { status: "UNKNOWN" },
      socket: { status: "UNKNOWN" },
      inngest: { status: "UNKNOWN" },
      cloudinary: { status: "UNKNOWN" },
      resend: { status: "UNKNOWN" },
      twilio: { status: "UNKNOWN" },
    },
  };

  const checks = [];

  // Database check with latency
  const dbStart = Date.now();
  checks.push(
    prisma.$queryRaw`SELECT 1`
      .then(() => {
          healthStatus.services.database.status = "UP";
          healthStatus.services.database.latency = Date.now() - dbStart;
      })
      .catch((err) => {
        console.error("[Health Check] Database down:", err);
        healthStatus.services.database.status = "DOWN";
      })
  );

  // Redis check with latency
  if (redis) {
    const redisStart = Date.now();
    checks.push(
      redis.ping()
        .then((res: boolean) => {
            healthStatus.services.redis.status = res ? "UP" : "DOWN";
            healthStatus.services.redis.latency = Date.now() - redisStart;
        })
        .catch(() => { healthStatus.services.redis.status = "DOWN"; })
    );
  } else {
    healthStatus.services.redis.status = "DOWN";
  }

  // Meilisearch check with latency
  if (meiliClient) {
    const meiliStart = Date.now();
    checks.push(
      meiliClient.isHealthy()
        .then((res: boolean) => {
            healthStatus.services.meilisearch.status = res ? "UP" : "DOWN";
            healthStatus.services.meilisearch.latency = Date.now() - meiliStart;
        })
        .catch(() => { healthStatus.services.meilisearch.status = "DOWN"; })
    );
  } else {
    healthStatus.services.meilisearch.status = "DOWN";
  }

  // Configuration checks (Immediate)
  healthStatus.services.socket.status = process.env.NEXT_PUBLIC_SOCKET_URL ? "UP" : "DOWN";
  healthStatus.services.inngest.status = (process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY) ? "UP" : "DOWN";
  healthStatus.services.cloudinary.status = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) ? "UP" : "DOWN";
  healthStatus.services.resend.status = process.env.RESEND_API_KEY ? "UP" : "DOWN";
  healthStatus.services.twilio.status = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) ? "UP" : "DOWN";

  // Wait for all async checks
  await Promise.allSettled(checks);

  healthStatus.responseTime = Date.now() - startTime;

  // Determine overall status
  const criticalServices = [healthStatus.services.database.status, healthStatus.services.redis.status];
  const secondaryServices = [
    healthStatus.services.meilisearch.status,
    healthStatus.services.resend.status,
    healthStatus.services.twilio.status,
    healthStatus.services.cloudinary.status
  ];

  if (criticalServices.includes("DOWN")) {
    healthStatus.status = "ERROR";
  } else if (secondaryServices.includes("DOWN")) {
    healthStatus.status = "DEGRADED";
  }

  const statusCode = healthStatus.status === "ERROR" ? 503 : 200;
  return NextResponse.json(healthStatus, { status: statusCode });
}
