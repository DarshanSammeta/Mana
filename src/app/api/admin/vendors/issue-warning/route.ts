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
    const { vendor_id, severity, reason } = body;

    await AuditService.log({
        entityType: "VENDOR_PROFILE",
        entityId: vendor_id,
        vendorId: vendor_id,
        module: "VENDOR_MANAGEMENT",
        action: `VENDOR_WARNING_ISSUED`,
        performedByUserId: admin.userId,
        performedByRole: admin.role,
        metadata: { severity, reason },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    // If severity is SUSPEND, update profile
    if (severity === 'SUSPEND' || severity === 'DEACTIVATE') {
        await prisma.vendorprofile.update({
            where: { id: vendor_id },
            data: {
                verificationStatus: severity === 'SUSPEND' ? 'SUSPENDED' : 'REJECTED',
                isActive: false
            }
        });
    }

    return NextResponse.json({ success: true });
  }, req);
}
