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

    const latestQuote = booking.counterquote[0];

    const updatedBooking = await prisma.$transaction(async (tx) => {
      if (latestQuote) {
          await tx.counterquote.update({
            where: { id: latestQuote.id },
            data: { status: "REJECTED" }
          });
      }

      const { TimelineService } = await import("@/services/server/timeline.service");
      return await TimelineService.transitionStatus(
          bookingId,
          "COUNTER_REJECTED",
          { id: payload.userId, name: (payload as any).fullName || "Customer", role: "CUSTOMER" },
          "Customer rejected the counter-quote",
          tx
      );
    });

    if (booking.vendorprofile) {
        emitSocketEvent(booking.vendorprofile.userId, "BOOKING_REJECTED", {
            bookingId,
            message: "Customer rejected your counter-quote"
        });
    }

    return NextResponse.json({
        success: true,
        message: "Counter-quote rejected successfully",
        data: updatedBooking
    });
  });
}
