import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { vendorId, status, rejectionReason } = body;

    if (!vendorId || !status) {
        return NextResponse.json({ message: "vendorId and status are required" }, { status: 400 });
    }

    // Forward to the specific route logic or just call it directly here
    // For simplicity, let's call the same service/logic or redirect
    // Since Next.js doesn't easily allow internal route calling, I'll use the logic from the other route

    const { prisma } = await import("@/lib/prisma");
    const { AuditService } = await import("@/services/server/audit.service");

    const updatedProfile = await prisma.vendorprofile.update({
      where: { id: vendorId },
      data: {
        verificationStatus: status.toUpperCase() as any,
        rejectionReason: rejectionReason || null,
      },
    });

    await AuditService.log({
      entityType: "VENDOR_PROFILE",
      entityId: vendorId,
      vendorId: vendorId,
      module: "VENDOR_MANAGEMENT",
      action: `VENDOR_VERIFICATION_${status.toUpperCase()}`,
      performedByUserId: admin.userId,
      performedByRole: "ADMIN",
      metadata: { status, rejectionReason },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
        success: true,
        message: `Vendor ${status.toLowerCase()} successfully`,
        profile: updatedProfile
    });
  }, req);
}
