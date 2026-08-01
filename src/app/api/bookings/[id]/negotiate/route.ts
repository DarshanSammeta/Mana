import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

import { BookingAuthService } from "@/lib/services/booking-auth.service";

import { negotiateBookingSchema } from "@/validations/booking";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // 1. Authorization Check (Only Assigned Vendor)
    const isVendor = await BookingAuthService.isAssignedVendor(bookingId, payload.userId);
    if (!isVendor) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { totalAmount, notes } = negotiateBookingSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vendorprofile: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // Update via State Machine
    const { TimelineService } = await import("@/services/server/timeline.service");
    const updatedBooking = await TimelineService.transitionStatus(
        bookingId,
        "NEGOTIATING",
        { id: payload.userId, name: booking.vendorprofile!.businessName, role: "VENDOR" },
        notes || `Counter-quote sent: ${totalAmount}`
    );

    // Update amount separately
    await prisma.booking.update({
        where: { id: bookingId },
        data: { totalAmount }
    });

    // Notify customer
    try {
      const { NotificationTriggers } = await import("@/lib/notifications");
      await NotificationTriggers.bookingStatusUpdated(booking, "NEGOTIATING");
    } catch (err) {
      logger.error("Negotiation notification error", err);
    }

    return NextResponse.json({
        success: true,
        message: "Counter-quote sent successfully",
        data: updatedBooking,
        requestId: req.headers.get("x-request-id")
    });
  }, req);
}
