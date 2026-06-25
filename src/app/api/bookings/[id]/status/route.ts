import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { status, notes } = await req.json();
    const bookingId = id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vendorprofile: true, user: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // Permission check
    if (payload.role === "VENDOR" && booking.vendorprofile.userId !== payload.userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status,
          bookingstatuslog: {
            create: {
              id: crypto.randomUUID(),
              status,
              notes
            }
          }
        },
        include: { vendorprofile: true }
      });

      // Handle Payout when event is completed
      if (status === "EVENT_COMPLETED" && booking.status !== "EVENT_COMPLETED") {
        const vendorUserId = updated.vendorprofile.userId;
        const payoutAmount = updated.vendorPayout;

        // Get or Create Wallet
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

        // Update Wallet Balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: payoutAmount },
            lifetimeEarnings: { increment: payoutAmount },
            withdrawable: { increment: payoutAmount }
          }
        });

        // Create Transaction Record
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
      }

      return updated;
    });

    // Create notification for the other party
    const notificationUserId = payload.role === "VENDOR" ? booking.customerId : booking.vendorprofile.userId;
    await prisma.notification.create({
        data: {
            id: crypto.randomUUID(),
            userId: notificationUserId,
            title: "Booking Update",
            message: `Booking ${booking.bookingNumber} status changed to ${status}`,
            type: "BOOKING_UPDATE",
            link: `/customer/bookings/${booking.id}`
        }
    });

    // Create Activity Log
    await prisma.activitylog.create({
        data: {
            id: crypto.randomUUID(),
            userId: payload.userId,
            action: "BOOKING_STATUS_UPDATE",
            details: `Changed booking ${booking.bookingNumber} status to ${status}`
        }
    });

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
