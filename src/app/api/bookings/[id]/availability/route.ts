import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const { available } = await req.json();
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    logger.info("Vendor reporting availability", { bookingId: id, available, userId: payload.userId });

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vendorprofile: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (!booking.vendorprofile || booking.vendorprofile.userId !== payload.userId) {
      logger.warn("Unauthorized availability update attempt", { bookingId: id, userId: payload.userId });
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (available) {
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          vendorConfirmedAt5d: true,
          bookingstatuslog: {
            create: {
              id: crypto.randomUUID(),
              status: booking.status,
              notes: "Vendor confirmed availability 5 days before the event."
            }
          }
        }
      });

      // Notify Customer
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: booking.customerId,
          title: "Vendor Confirmed",
          message: `Your vendor has confirmed their availability for "${booking.eventName}".`,
          category: "BOOKING",
          link: `/customer/bookings/${booking.id}`
        }
      });

      return NextResponse.json(updated);
    } else {
      // Step 9: Trigger Auto-Reassignment
      logger.warn("Vendor declared unavailability, triggering reassignment", { bookingId: id });

      await prisma.booking.update({
        where: { id },
        data: {
          vendorConfirmedAt5d: false,
          status: "PENDING",
          vendorId: "reassigning", // Logic in cron will handle the actual replacement
          bookingstatuslog: {
            create: {
              id: crypto.randomUUID(),
              status: "PENDING",
              notes: "Vendor declared unavailability 5 days before event. Triggering reassignment."
            }
          }
        }
      });

      // Mark current assignment as REJECTED or CANCELLED
      if (booking.vendorId) {
        await prisma.bookingassignment.updateMany({
          where: { bookingId: id, vendorId: booking.vendorId },
          data: { status: "REJECTED" }
        });
      }

      return NextResponse.json({ message: "Reassignment triggered" });
    }
  });
}
