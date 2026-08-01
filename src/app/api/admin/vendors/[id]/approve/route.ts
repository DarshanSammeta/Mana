import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { AuditService } from "@/services/server/audit.service";
import { NotificationService } from "@/lib/notifications";

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const vendor = await prisma.vendorprofile.findUnique({
      where: { id },
      select: { userId: true, verificationStatus: true }
    });

    if (!vendor) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    const prevStatus = vendor.verificationStatus;

    await prisma.$transaction(async (tx) => {
      await tx.vendorprofile.update({
        where: { id },
        data: {
          verificationStatus: "APPROVED",
          approvedAt: new Date(),
          approvedBy: admin.userId,
          reviewedAt: new Date(),
        }
      });

      await AuditService.logVendorAction(id, "VENDOR_APPROVED", {
        id: admin.userId,
        role: admin.role,
        name: "System Administrator"
      }, {
        previousStatus: prevStatus,
        newStatus: "APPROVED"
      }, tx);
    });

    await NotificationService.triggers.vendorAccountStatus(vendor.userId, "APPROVED");

    // Invalidate session to force role/status update
    try {
      const { safeRedis } = await import("@/lib/redis");
      await safeRedis.set(`session:stale:${vendor.userId}`, "true", 3600); // 1 hour expiry
    } catch (e) {
      logger.error("Failed to set stale session flag", e);
    }

    logger.info("Vendor approved", { vendorId: id, adminId: admin.userId });

    return NextResponse.json({ message: "Vendor approved successfully" });
  }, req);
}
