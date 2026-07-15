import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { createAuditLog } from "@/lib/audit";
import logger from "@/lib/logger";
import { z } from "zod";
import { VendorNotifications } from "@/lib/notifications/vendor";

const verifySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUIRED"]),
  rejectionReason: z.string().optional(),
  rejectedDocuments: z.array(z.string()).optional(),
  comment: z.string().optional(),
});

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: vendorProfileId } = await params;
    const body = await req.json();
    const validated = verifySchema.parse(body);

    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { id: vendorProfileId },
      include: { user: true },
    });

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // Update Vendor Profile
    const updatedProfile = await prisma.vendorprofile.update({
      where: { id: vendorProfileId },
      data: {
        verificationStatus: validated.status as any,
        rejectionReason: validated.rejectionReason || validated.comment,
        rejectedDocuments: validated.rejectedDocuments || [],
      },
    });

    // Create Audit Log
    await createAuditLog({
      userId: admin.userId,
      action: `VENDOR_VERIFICATION_${validated.status}`,
      details: {
        vendorProfileId,
        vendorUserId: vendorProfile.userId,
        ...validated
      },
      ipAddress: ip,
    });

    // Create Notification for Vendor
    if (validated.status === "APPROVED") {
      await VendorNotifications.approved(vendorProfile.userId);
    } else if (validated.status === "REJECTED") {
      await VendorNotifications.rejected(vendorProfile.userId, validated.rejectionReason || "No reason provided");
    } else if (validated.status === "CHANGES_REQUIRED") {
      await VendorNotifications.changesRequested(vendorProfile.userId, validated.comment || "Please check your profile details");
    }

    logger.info("Vendor verification status updated by admin", {
        adminId: admin.userId,
        vendorId: vendorProfileId,
        status: validated.status
    });

    return NextResponse.json({
        success: true,
        message: `Vendor ${validated.status.toLowerCase()} successfully`,
        profile: updatedProfile
    });
  }, req);
}
