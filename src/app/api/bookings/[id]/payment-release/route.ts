import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { AuditService } from "@/services/server/audit.service";

import { BookingAuthService } from "@/lib/services/booking-auth.service";

// POST /api/bookings/[id]/payment-release - Customer confirms completion and releases payment
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "CUSTOMER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 1. Authorization Check (Only Customer)
    const canAccess = await BookingAuthService.canAccess(bookingId, payload.userId, payload.role);
    if (!canAccess) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vendorprofile: true,
        customerprofile: true
      }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    if (booking.status !== "EVENT_COMPLETED") {
       return NextResponse.json({ message: `Cannot release payment. Event status: ${booking.status}. It must be EVENT_COMPLETED.` }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Booking Status via State Machine
      const { TimelineService } = await import("@/services/server/timeline.service");

      // Step 1: Customer Confirmed
      await TimelineService.transitionStatus(
          bookingId,
          "CUSTOMER_CONFIRMED",
          { id: payload.userId, name: (payload as any).fullName || "Customer", role: payload.role },
          "Customer confirmed event completion",
          tx
      );

      // Step 2: Payment Released
      const updated = await TimelineService.transitionStatus(
          bookingId,
          "PAYMENT_RELEASED",
          { id: payload.userId, name: (payload as any).fullName || "Customer", role: payload.role },
          "Payment released to vendor wallet",
          tx
      );

      // 2. Wallet Logic
      const vendorUserId = updated.vendorprofile!.userId;
      const payoutAmount = updated.vendorPayout;

      let wallet = await tx.wallet.findUnique({
        where: { userId: vendorUserId }
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            id: crypto.randomUUID(),
            userId: vendorUserId,
            balance: 0,
            type: "VENDOR"
          }
        });
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: payoutAmount },
          lifetimeEarnings: { increment: payoutAmount },
          withdrawable: { increment: payoutAmount }
        }
      });

      await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          walletId: wallet.id,
          bookingId: bookingId,
          amount: payoutAmount,
          type: "CREDIT",
          status: "COMPLETED",
          description: `Payout for booking #${updated.bookingNumber}`
        }
      });

      return updated;
    });

    // Notify Vendor
    try {
        await prisma.notification.create({
            data: {
                id: crypto.randomUUID(),
                userId: booking.vendorprofile!.userId,
                title: "Payment Released",
                message: `Payment of ₹${booking.vendorPayout} for booking #${booking.bookingNumber} has been added to your wallet.`,
                category: "PAYMENT",
                link: `/vendor/wallet`
            }
        });
    } catch (e) {
        logger.error("Failed to notify vendor about payment release", e);
    }

    await AuditService.logPayment(
        "N/A",
        bookingId,
        "BOOKING_PAYMENT_RELEASED",
        { id: payload.userId, name: (payload as any).fullName || "Customer", role: payload.role },
        { amount: booking.vendorPayout }
    );

    return NextResponse.json({ message: "Payment released successfully", status: result.status });
  });
}
