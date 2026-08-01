import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { AuditService } from "@/services/server/audit.service";

import { BookingAuthService } from "@/lib/services/booking-auth.service";
import { TimelineService } from "@/services/server/timeline.service";

// PATCH /api/bookings/[id]/otp/check-in - Vendor submits OTP to start event
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const { otp } = await req.json();
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden: Only vendors can perform check-in" }, { status: 403 });
    }

    // 1. Authorization Check (Only Assigned Vendor)
    const isVendor = await BookingAuthService.isAssignedVendor(bookingId, payload.userId);
    if (!isVendor) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        eventcheckin: true,
        vendorprofile: { select: { businessName: true } },
        customerprofile: { select: { userId: true } }
      }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    if (booking.status !== "OTP_VERIFICATION_PENDING") {
      return NextResponse.json({ message: `Cannot check-in. Current status: ${booking.status}` }, { status: 400 });
    }

    if (!booking.eventcheckin || booking.eventcheckin.otp !== otp) {
      return NextResponse.json({ message: "Invalid check-in OTP" }, { status: 400 });
    }

    if (booking.eventcheckin.status === "VERIFIED") {
        return NextResponse.json({ message: "Already checked in" }, { status: 400 });
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // 1. Update checkin status
      await tx.eventcheckin.update({
        where: { bookingId },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date()
        }
      });

      // 2. Update booking status via State Machine
      const updated = await TimelineService.transitionStatus(
          bookingId,
          "EVENT_STARTED",
          { id: payload.userId, name: booking.vendorprofile!.businessName, role: "VENDOR" },
          "OTP verified. Event started.",
          tx
      );

      return updated;
    });

    // Notify Customer
    try {
        if (booking.customerprofile) {
            await prisma.notification.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: booking.customerprofile.userId,
                    title: "Event Started",
                    message: `Check-in successful! Your event "${booking.eventName}" has officially started.`,
                    category: "BOOKING",
                    link: `/customer/bookings/${booking.id}`
                }
            });
        }
    } catch (e) {
        logger.error("Failed to create start event notification", e);
    }

    await AuditService.logBooking(
        bookingId,
        "BOOKING_CHECKIN_SUCCESS",
        { id: payload.userId, name: booking.vendorprofile!.businessName, role: payload.role },
        undefined,
        { ipAddress: req.headers.get("x-forwarded-for") || "unknown" }
    );

    return NextResponse.json({ message: "Check-in successful", status: updatedBooking.status });
  });
}
