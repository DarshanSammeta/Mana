import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        loginAttempts: true,
        lockUntil: true
      }
    });
    return NextResponse.json(users);
  }, req);
}

export async function PATCH(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { id, ...data } = body;

    // Remove sensitive fields that shouldn't be patched directly
    delete data.password;
    delete data.id;

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: admin.userId,
      action: "USER_UPDATED_BY_ADMIN",
      details: { targetUserId: id, updates: data },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    logger.info("User updated by admin", { adminId: admin.userId, targetUserId: id, updates: data });

    return NextResponse.json(updatedUser);
  }, req);
}
