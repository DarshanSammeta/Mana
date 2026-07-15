import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { meiliClient } from "@/lib/meilisearch";
import os from "os";

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
    database: "UP" | "DOWN" | "UNKNOWN";
    redis: "UP" | "DOWN" | "UNKNOWN";
    meilisearch: "UP" | "DOWN" | "UNKNOWN";
    socket: "UP" | "DOWN" | "UNKNOWN";
    inngest: "UP" | "DOWN" | "UNKNOWN";
    cloudinary: "UP" | "DOWN" | "UNKNOWN";
    resend: "UP" | "DOWN" | "UNKNOWN";
    twilio: "UP" | "DOWN" | "UNKNOWN";
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
      database: "UNKNOWN",
      redis: "UNKNOWN",
      meilisearch: "UNKNOWN",
      socket: "UNKNOWN",
      inngest: "UNKNOWN",
      cloudinary: "UNKNOWN",
      resend: "UNKNOWN",
      twilio: "UNKNOWN",
    },
  };

  const checks = [];

  // Database check
  checks.push(
    prisma.$queryRaw`SELECT 1`
      .then(() => { healthStatus.services.database = "UP"; })
      .catch((err) => {
        console.error("[Health Check] Database down:", err);
        healthStatus.services.database = "DOWN";
      })
  );

  // Redis check
  if (redis) {
    checks.push(
      redis.ping()
        .then((res: boolean) => { healthStatus.services.redis = res ? "UP" : "DOWN"; })
        .catch(() => { healthStatus.services.redis = "DOWN"; })
    );
  } else {
    healthStatus.services.redis = "DOWN";
  }

  // Meilisearch check
  if (meiliClient) {
    checks.push(
      meiliClient.isHealthy()
        .then((res: boolean) => { healthStatus.services.meilisearch = res ? "UP" : "DOWN"; })
        .catch(() => { healthStatus.services.meilisearch = "DOWN"; })
    );
  } else {
    healthStatus.services.meilisearch = "DOWN";
  }

  // Socket check (Simplified for Next.js - checks if socket URL is configured)
  healthStatus.services.socket = process.env.NEXT_PUBLIC_SOCKET_URL ? "UP" : "DOWN";

  // Inngest check
  healthStatus.services.inngest = (process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY) ? "UP" : "DOWN";

  // Cloudinary check
  healthStatus.services.cloudinary = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) ? "UP" : "DOWN";

  // Resend check (Email)
  healthStatus.services.resend = process.env.RESEND_API_KEY ? "UP" : "DOWN";

  // Twilio check (SMS)
  healthStatus.services.twilio = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) ? "UP" : "DOWN";

  // Wait for all async checks
  await Promise.allSettled(checks);

  healthStatus.responseTime = Date.now() - startTime;

  // Determine overall status
  const criticalServices = [healthStatus.services.database, healthStatus.services.redis];
  const secondaryServices = [
    healthStatus.services.meilisearch,
    healthStatus.services.resend,
    healthStatus.services.twilio,
    healthStatus.services.cloudinary
  ];

  if (criticalServices.includes("DOWN")) {
    healthStatus.status = "ERROR";
  } else if (secondaryServices.includes("DOWN")) {
    healthStatus.status = "DEGRADED";
  }

  const statusCode = healthStatus.status === "ERROR" ? 503 : 200;
  return NextResponse.json(healthStatus, { status: statusCode });
}
