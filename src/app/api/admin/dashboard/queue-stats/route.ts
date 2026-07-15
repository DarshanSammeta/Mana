import { NextResponse } from "next/server";
import { safeRedis } from "@/lib/redis";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // BullMQ prefix is usually 'bull'
    const queueKeys = await safeRedis.keys('bull:*:wait');
    const activeKeys = await safeRedis.keys('bull:*:active');
    const failedKeys = await safeRedis.keys('bull:*:failed');

    const stats = {
      pendingAssignments: 0,
      activeJobs: 0,
      failedJobs: 0,
      queues: [] as any[]
    };

    for (const key of queueKeys) {
      const count = await safeRedis.llen(key);
      stats.pendingAssignments += count;
      stats.queues.push({ name: key.split(':')[1], pending: count });
    }

    stats.activeJobs = (await Promise.all(activeKeys.map(k => safeRedis.scard(k)))).reduce((a: number, b: number) => a + b, 0);
    stats.failedJobs = (await Promise.all(failedKeys.map(k => safeRedis.zcard(k)))).reduce((a: number, b: number) => a + b, 0);

    // Get Socket Connection Count (Mocked or from Socket Server)
    const socketCount = await safeRedis.get('stats:socket_connections') || 0;

    return NextResponse.json({
        ...stats,
        onlineUsers: Number(socketCount),
        systemHealth: "OPERATIONAL"
    });
  }, req);
}
