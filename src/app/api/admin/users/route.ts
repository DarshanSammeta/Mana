import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: payload.userId,
      action: "USER_UPDATED",
      details: { targetUserId: id, updates: data },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
