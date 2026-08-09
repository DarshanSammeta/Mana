import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { amount } = body;

    // Logic for refund
    // In a real app, this would call Razorpay/Stripe API
    // For now, we update the database

    const { prisma } = await import("@/lib/prisma");
    const { AuditService } = await import("@/services/server/audit.service");

    const refund = await prisma.refund.create({
        data: {
            id: `REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            amount,
            status: "PROCESSED",
            reason: "Admin initiated refund",
            booking: { connect: { id } } // Assuming id passed is booking id as per frontend call style in some places, or payment id
        }
    });

    await AuditService.log({
        entityType: "PAYMENT",
        entityId: id,
        module: "FINANCE",
        action: "REFUND_PROCESSED",
        performedByUserId: admin.userId,
        performedByRole: "ADMIN",
        metadata: { amount, refundId: refund.id },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    return NextResponse.json({ success: true, refund });
  }, req);
}
