import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

import { booking_status, dispute_status } from "@prisma/client";

const resolutionSchema = z.object({
  resolution: z.string().min(10),
  refundAmount: z.number().nonnegative().optional(),
  penaltyAmount: z.number().nonnegative().optional(),
  status: z.enum(["RESOLVED", "REJECTED"]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: disputeId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const validated = resolutionSchema.parse(body);

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true }
    });

    if (!dispute) return NextResponse.json({ message: "Dispute not found" }, { status: 404 });

    const updatedDispute = await prisma.$transaction(async (tx) => {
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: validated.status === "RESOLVED" ? dispute_status.RESOLVED : dispute_status.REJECTED,
          resolution: validated.resolution,
          updatedAt: new Date(),
        }
      });

      // Update booking status back to something appropriate
      await tx.booking.update({
        where: { id: dispute.bookingId },
        data: {
          status: validated.status === "RESOLVED" ? booking_status.EVENT_COMPLETED : booking_status.CONFIRMED // Logic depends on resolution
        }
      });

      // Handle refunds if any
      if (validated.refundAmount && validated.refundAmount > 0) {
        // Logic to initiate refund via payment provider or wallet
      }

      return updated;
    });

    await createAuditLog({
      userId: payload.userId,
      action: "DISPUTE_RESOLVED",
      details: { disputeId, resolution: validated.status },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    return NextResponse.json(updatedDispute);
  });
}
