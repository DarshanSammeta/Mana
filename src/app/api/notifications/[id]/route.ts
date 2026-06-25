import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { isRead } = await req.json();

    const notification = await prisma.notification.update({
      where: { id: id, userId: payload.userId },
      data: { isRead }
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
