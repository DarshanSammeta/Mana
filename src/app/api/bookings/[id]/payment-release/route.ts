import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { createAuditLog } from "@/lib/audit";

// POST /api/bookings/[id]/payment-release - Customer confirms completion and releases payment
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "CUSTOMER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vendorprofile: true
      }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.customerId !== payload.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "EVENT_COMPLETED") {
       return NextResponse.json({ message: `Cannot release payment. Event status: ${booking.status}. It must be EVENT_COMPLETED.` }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Booking Status to CUSTOMER_CONFIRMED then PAYMENT_RELEASED
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "PAYMENT_RELEASED",
          bookingstatuslog: {
            create: [
                {
                  id: crypto.randomUUID(),
                  status: "CUSTOMER_CONFIRMED",
                  notes: "Customer confirmed event completion"
                },
                {
                  id: crypto.randomUUID(),
                  status: "PAYMENT_RELEASED",
                  notes: "Payment released to vendor wallet"
                }
            ]
          }
        },
        include: {
          vendorprofile: true
        }
      });

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

    await createAuditLog({
        userId: payload.userId,
        action: "BOOKING_PAYMENT_RELEASED",
        details: { bookingId, amount: booking.vendorPayout },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    return NextResponse.json({ message: "Payment released successfully", status: result.status });
  });
}
