import { NextResponse } from "next/server";
import { getIoRedis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import os from "os";

import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const redis = getIoRedis();
    let redisStatus = "OFFLINE";
    let redisMemory = "0";

    if (redis) {
      try {
        const info = await redis.info("memory");
        const match = info.match(/used_memory_human:(\S+)/);
        redisMemory = match ? match[1] : "unknown";
        redisStatus = "ONLINE";
      } catch (error) {
        console.error(error);
        redisStatus = "ERROR";
      }
    }

    // Database check
    let dbStatus = "ONLINE";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error(error);
      dbStatus = "OFFLINE";
    }

    const health = {
      system: {
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        cpuLoad: os.loadavg(),
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
      },
      services: {
        redis: {
          status: redisStatus,
          memory: redisMemory
        },
        database: {
          status: dbStatus
        },
        bullmq: {
            status: "ONLINE" // Placeholder, should check queue health
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(health);
  }, req);
}
