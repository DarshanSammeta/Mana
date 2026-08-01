import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

import { BookingAuthService } from "@/lib/services/booking-auth.service";

import { z } from "zod";

const availabilitySchema = z.object({
    available: z.boolean()
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const body = await req.json();
    const { available } = availabilitySchema.parse(body);
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // 1. Authorization Check (Only Assigned Vendor)
    const isVendor = await BookingAuthService.isAssignedVendor(bookingId, payload.userId);
    if (!isVendor) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    logger.info("Vendor reporting availability", { bookingId, available, userId: payload.userId });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vendorprofile: true, customerprofile: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    if (available) {
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          vendorConfirmedAt5d: true,
          bookingstatuslog: {
            create: {
              id: crypto.randomUUID(),
              status: booking.status as any,
              notes: "Vendor confirmed availability 5 days before the event."
            }
          }
        }
      });

      // Notify Customer
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: booking.customerprofile.userId,
          title: "Vendor Confirmed",
          message: `Your vendor has confirmed their availability for "${booking.eventName}".`,
          category: "BOOKING",
          link: `/customer/bookings/${booking.id}`
        }
      });

      return NextResponse.json({
          success: true,
          message: "Availability confirmed",
          data: updated,
          requestId: req.headers.get("x-request-id")
      });
    } else {
      // Trigger Auto-Reassignment via State Machine & Transaction
      logger.warn("Vendor declared unavailability, triggering reassignment", { bookingId });

      await prisma.$transaction(async (tx) => {
          const { TimelineService } = await import("@/services/server/timeline.service");
          await TimelineService.transitionStatus(
              bookingId,
              "PENDING",
              { id: payload.userId, name: booking.vendorprofile!.businessName, role: "VENDOR" },
              "Vendor declared unavailability 5 days before event. Triggering reassignment.",
              tx
          );

          // Additional updates not handled by state machine
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              vendorConfirmedAt5d: false,
              vendorId: "reassigning", // Logic in cron will handle the actual replacement
            }
          });

          // Mark current assignment as REJECTED
          if (booking.vendorId) {
            await tx.bookingassignment.updateMany({
              where: { bookingId: bookingId, vendorId: booking.vendorId },
              data: { status: "REJECTED" }
            });
          }
      });

      return NextResponse.json({
          success: true,
          message: "Reassignment triggered",
          requestId: req.headers.get("x-request-id")
      });
    }
  });
}
