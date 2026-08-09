import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/server/audit.service";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { vendor_id, stage, status, note } = body;

    // Use AuditService as verification events are essentially logged transitions
    await AuditService.log({
        entityType: "VENDOR_PROFILE",
        entityId: vendor_id,
        vendorId: vendor_id,
        module: "VENDOR_MANAGEMENT",
        action: `VERIFICATION_STAGE_${stage}`,
        performedByUserId: admin.userId,
        performedByRole: admin.role,
        metadata: { stage, status, note },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    return NextResponse.json({ success: true });
  }, req);
}
