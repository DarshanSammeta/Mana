import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { emitSocketEvent } from "@/lib/socket-helper";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "CUSTOMER") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
          vendorprofile: true,
          customerprofile: true,
          counterquote: { where: { status: "ACTIVE" }, orderBy: { version: "desc" }, take: 1 }
      }
    });

    if (!booking || booking.customerprofile.userId !== payload.userId) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.status !== "COUNTERED") return NextResponse.json({ message: "No active counter-quote to accept" }, { status: 400 });

    const latestQuote = booking.counterquote[0];
    if (!latestQuote) return NextResponse.json({ message: "Counter-quote data missing" }, { status: 404 });

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // 1. Mark quote as accepted
      await tx.counterquote.update({
        where: { id: latestQuote.id },
        data: { status: "ACCEPTED" }
      });

      // 2. Transition booking
      const { TimelineService } = await import("@/services/server/timeline.service");
      const result = await TimelineService.transitionStatus(
          bookingId,
          "ACCEPTED" as any,
          { id: payload.userId, name: (payload as any).fullName || "Customer", role: "CUSTOMER" },
          "Customer accepted the counter-quote",
          tx
      );

      // 3. Move to payment pending
      await tx.booking.update({
          where: { id: bookingId },
          data: {
              status: "ADVANCE_PAYMENT_PENDING",
              paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
      });

      return result;
    });

    // Notify Vendor
    if (booking.vendorprofile) {
        emitSocketEvent(booking.vendorprofile.userId, "BOOKING_ACCEPTED", {
            bookingId,
            message: "Customer accepted your counter-quote"
        });
    }

    return NextResponse.json({
        success: true,
        message: "Counter-quote accepted successfully",
        data: updatedBooking
    });
  });
}
