import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { AuditService } from "@/services/server/audit.service";
import { z } from "zod";

import { booking_status, dispute_status } from "@prisma/client";

const resolutionSchema = z.object({
  resolution: z.string().min(5).optional(),
  resolution_note: z.string().min(5).optional(),
  refundAmount: z.number().nonnegative().optional(),
  refund_amount: z.number().nonnegative().optional(),
  penaltyAmount: z.number().nonnegative().optional(),
  status: z.enum(["RESOLVED", "REJECTED", "resolved", "rejected"]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: disputeId } = await params;
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const validated = resolutionSchema.parse(body);

    const resolutionText = validated.resolution || validated.resolution_note || "Resolved by admin";
    const refundVal = validated.refundAmount ?? validated.refund_amount ?? 0;
    const finalStatus = validated.status.toUpperCase() as "RESOLVED" | "REJECTED";

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true }
    });

    if (!dispute) return NextResponse.json({ message: "Dispute not found" }, { status: 404 });

    const updatedDispute = await prisma.$transaction(async (tx) => {
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: finalStatus === "RESOLVED" ? dispute_status.RESOLVED : dispute_status.REJECTED,
          resolution: resolutionText,
          updatedAt: new Date(),
        }
      });

      // Update booking status back to something appropriate via State Machine
      const { TimelineService } = await import("@/services/server/timeline.service");
      const nextBookingStatus = finalStatus === "RESOLVED" ? booking_status.EVENT_COMPLETED : booking_status.CONFIRMED;

      await TimelineService.transitionStatus(
          dispute.bookingId,
          nextBookingStatus,
          { id: admin.userId, name: "Admin Resolution", role: "ADMIN" },
          `Dispute Resolved: ${resolutionText}`,
          tx
      );

      // Handle refunds if any
      if (refundVal > 0) {
        // Logic to initiate refund via payment provider or wallet
      }

      return updated;
    });

    await AuditService.log({
      entityType: "DISPUTE",
      entityId: disputeId,
      module: "OPS",
      action: "DISPUTE_RESOLVED",
      performedByUserId: admin.userId,
      performedByRole: admin.role,
      metadata: { resolution: finalStatus },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    return NextResponse.json(updatedDispute);
  });
}
