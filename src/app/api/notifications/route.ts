import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request) {
  return withErrorHandler(async (innerReq: Request) => {
    const token = innerReq.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(innerReq.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const notifications = await prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: payload.userId, isRead: false }
    });

    return NextResponse.json({
      notifications,
      unreadCount
    });
  }, req);
}

export async function PATCH(req: Request) {
  return withErrorHandler(async (innerReq: Request) => {
    const token = innerReq.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { notificationIds, all } = await innerReq.json();

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: payload.userId, isRead: false },
        data: { isRead: true }
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: { userId: payload.userId, id: { in: notificationIds } },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ success: true });
  }, req);
}
