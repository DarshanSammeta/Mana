import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");

    logger.info("Fetching notifications", { userId: payload.userId, limit, cursor });

    const notifications = await prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    let nextCursor: typeof cursor | undefined = undefined;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
      items: notifications,
      nextCursor
    });
  });
}

export async function PATCH(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id, all } = await req.json();

    if (all) {
        logger.info("Marking all notifications as read", { userId: payload.userId });
        await prisma.notification.updateMany({
            where: { userId: payload.userId },
            data: { isRead: true }
        });
    } else {
        if (!id) return NextResponse.json({ message: "Notification ID is required" }, { status: 400 });
        logger.info("Marking notification as read", { notificationId: id, userId: payload.userId });
        await prisma.notification.update({
            where: { id, userId: payload.userId },
            data: { isRead: true }
        });
    }

    return NextResponse.json({ success: true });
  });
}
