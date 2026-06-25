import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { id, all } = await req.json();

    if (all) {
        await prisma.notification.updateMany({
            where: { userId: payload.userId },
            data: { isRead: true }
        });
    } else {
        await prisma.notification.update({
            where: { id, userId: payload.userId },
            data: { isRead: true }
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
