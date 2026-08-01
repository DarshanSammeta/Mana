import "server-only";
import { getPrisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export class RefundService {
  /**
   * Calculates the refund amount based on the cancellation policy and days remaining.
   * If isSystemAction is true (e.g. Vendor Rejection), it forces a 100% refund.
   */
  static async calculateRefund(bookingId: string, isSystemAction: boolean = false) {
    const prisma = getPrisma();
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { totalAmount: true, eventDate: true, advanceAmount: true }
    });

    if (!booking) throw new Error("Booking not found");

    if (isSystemAction) {
        return {
            diffDays: 0,
            refundPercentage: 100,
            refundAmount: Number(booking.totalAmount), // Assuming full refund for system actions
            cancellationCharge: 0,
            policyName: "Full System Refund"
        };
    }

    const now = new Date();
    const eventDate = new Date(booking.eventDate);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 1. Fetch matching policy
    const policy = await prisma.refund_policy.findFirst({
        where: {
            daysBefore: { lte: diffDays },
            isActive: true
        },
        orderBy: { daysBefore: 'desc' }
    });

    // Default policy logic if none found
    let refundPercentage = 0;
    if (!policy) {
        if (diffDays >= 30) refundPercentage = 100;
        else if (diffDays >= 15) refundPercentage = 75;
        else if (diffDays >= 7) refundPercentage = 50;
        else if (diffDays >= 3) refundPercentage = 25;
        else refundPercentage = 0;
    } else {
        refundPercentage = policy.refundPercentage;
    }

    const totalAmount = new Decimal(booking.totalAmount as any);
    const refundAmount = totalAmount.mul(refundPercentage).div(100);
    const cancellationCharge = totalAmount.sub(refundAmount);

    return {
        diffDays,
        refundPercentage,
        refundAmount: refundAmount.toNumber(),
        cancellationCharge: cancellationCharge.toNumber(),
        policyName: policy?.name || "Standard Cancellation Policy"
    };
  }

  /**
   * Creates a formal refund request for a booking.
   */
  static async initiateRefund(bookingId: string, reason: string, isSystemAction: boolean = false) {
    const prisma = getPrisma();
    const calculation = await this.calculateRefund(bookingId, isSystemAction);

    return await prisma.refund_request.create({
      data: {
        bookingId,
        amount: calculation.refundAmount,
        reason: `${calculation.policyName}: ${reason}`,
        status: "PENDING"
      }
    });
  }
}
