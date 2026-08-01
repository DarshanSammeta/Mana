import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { NotificationService } from "@/lib/notifications";
import { AuditService } from "@/services/server/audit.service";
import logger from "@/lib/logger";
import { bulkVendorActionSchema } from "@/validations";

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { ids, action, reason } = bulkVendorActionSchema.parse(body);

    if ((action === "REJECT" || action === "SUSPEND") && !reason) {
      return NextResponse.json({ message: "Reason is required for this action" }, { status: 400 });
    }

    const statusMap: any = {
      APPROVE: "APPROVED",
      REJECT: "REJECTED",
      SUSPEND: "SUSPENDED"
    };

    const newStatus = statusMap[action];

    const vendors = await prisma.vendorprofile.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, verificationStatus: true }
    });

    const results = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        verificationStatus: newStatus,
        updatedAt: new Date(),
      };

      if (action === "APPROVE") {
        updateData.approvedAt = new Date();
        updateData.approvedBy = admin.userId;
        updateData.reviewedAt = new Date();
      } else if (action === "REJECT") {
        updateData.rejectedAt = new Date();
        updateData.rejectedBy = admin.userId;
        updateData.rejectionReason = reason;
        updateData.reviewedAt = new Date();
      } else if (action === "SUSPEND") {
        updateData.suspendedAt = new Date();
        updateData.suspendedBy = admin.userId;
        updateData.suspensionReason = reason;
      }

      await tx.vendorprofile.updateMany({
        where: { id: { in: ids } },
        data: updateData
      });

      // Create Audit Logs for each
      for (const v of vendors) {
        await AuditService.logVendorAction(v.id, `VENDOR_BULK_${action}`, {
          id: admin.userId,
          role: admin.role,
          name: "Admin"
        }, {
          previousStatus: v.verificationStatus,
          newStatus: newStatus,
          reason
        });
      }

      return { count: vendors.length };
    });

    // Send notifications outside transaction for better performance
    for (const v of vendors) {
      try {
        if (action === "APPROVE") await NotificationService.triggers.vendorAccountStatus(v.userId, "APPROVED");
        else if (action === "REJECT") await NotificationService.triggers.vendorAccountStatus(v.userId, "REJECTED", reason!);
        else if (action === "SUSPEND") await NotificationService.triggers.vendorAccountStatus(v.userId, "SUSPENDED", reason!);

        // Invalidate sessions in Redis
        const { safeRedis } = await import("@/lib/redis");
        await safeRedis.set(`session:stale:${v.userId}`, "true", 3600);
      } catch (err) {
        logger.error(`Failed to process post-bulk-action for vendor ${v.id}`, err);
      }
    }

    logger.info(`Bulk ${action} completed`, { count: results.count, adminId: admin.userId });

    return NextResponse.json({ message: `Successfully ${action.toLowerCase()}d ${results.count} vendors` });
  }, req);
}
