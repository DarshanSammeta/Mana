import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { AuditService } from "@/services/server/audit.service";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
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
      }),
      prisma.user.count()
    ]);

    return NextResponse.json({
      rows: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  }, req);
}

export async function PATCH(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
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

    await AuditService.log({
      entityType: "USER",
      entityId: id,
      module: "ADMIN",
      action: "USER_UPDATED_BY_ADMIN",
      performedByUserId: admin.userId,
      performedByRole: admin.role,
      metadata: { updates: data },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    logger.info("User updated by admin", { adminId: admin.userId, targetUserId: id, updates: data });

    return NextResponse.json(updatedUser);
  }, req);
}
