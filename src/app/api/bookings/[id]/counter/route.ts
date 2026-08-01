import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { emitSocketEvent } from "@/lib/socket-helper";

import { negotiateBookingSchema } from "@/validations/booking";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const body = await req.json();
    const { totalAmount, notes } = negotiateBookingSchema.parse(body);
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });
    if (!vendorProfile) return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
          counterquote: { orderBy: { version: "desc" }, take: 1 },
          customerprofile: true
      }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.vendorId && booking.vendorId !== vendorProfile.id) return NextResponse.json({ message: "Booking locked by another vendor" }, { status: 403 });

    const currentVersion = booking.counterquote[0]?.version || 0;
    const nextVersion = currentVersion + 1;

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // 1. Create versioned counter quote
      const quote = await tx.counterquote.create({
        data: {
          id: crypto.randomUUID(),
          bookingId,
          version: nextVersion,
          totalAmount,
          notes: notes || `Version ${nextVersion} quote`,
          createdBy: payload.userId,
          previousQuoteId: booking.counterquote[0]?.id || null,
          status: "ACTIVE"
        }
      });

      // 2. Mark previous quotes as inactive
      if (booking.counterquote[0]) {
        await tx.counterquote.update({
          where: { id: booking.counterquote[0].id },
          data: { status: "SUPERSEDED" }
        });
      }

      // 3. Update booking status and price
      const { TimelineService } = await import("@/services/server/timeline.service");
      const result = await TimelineService.transitionStatus(
          bookingId,
          "COUNTERED",
          { id: payload.userId, name: vendorProfile.businessName, role: "VENDOR" },
          notes || `Vendor sent a counter-quote of ₹${totalAmount}`,
          tx
      );

      await tx.booking.update({
          where: { id: bookingId },
          data: {
              totalAmount,
              currentQuoteId: quote.id,
              advanceAmount: totalAmount * 0.3,
              balanceAmount: totalAmount * 0.7
          }
      });

      return result;
    });

    // Notify Customer
    emitSocketEvent(booking.customerprofile.userId, "BOOKING_COUNTERED", {
        bookingId,
        totalAmount,
        version: nextVersion
    });

    return NextResponse.json({
        success: true,
        message: "Counter-quote sent successfully",
        data: updatedBooking
    });
  });
}
