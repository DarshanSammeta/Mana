import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { AuditService } from "@/services/server/audit.service";
import { inngest } from "@/lib/inngest";
import { emitSocketEvent } from "@/lib/socket-helper";
import { getIoRedis } from "@/lib/redis";
import { FraudDetectionService } from "@/services/server/fraud-detection.service";

import { acceptBookingSchema } from "@/validations/booking";

// PATCH /api/bookings/[id]/accept
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const body = await req.json();
    const { action, notes, counterQuote } = acceptBookingSchema.parse(body);
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
          bookingassignment: true,
          customerprofile: true
      }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // Atomic Lock using Redis to prevent double acceptance
    const redis = getIoRedis();
    const lockKey = `lock:booking:accept:${bookingId}`;
    if (action === "ACCEPT" && redis) {
      const acquired = await redis.set(lockKey, vendorProfile.id, "EX", 10, "NX");
      if (!acquired) {
        return NextResponse.json({ message: "Booking already accepted by another vendor" }, { status: 409 });
      }
    }

    try {
      const assignment = booking.bookingassignment.find(a => a.vendorId === vendorProfile.id);
      if (!assignment) return NextResponse.json({ message: "You are not assigned to this booking" }, { status: 403 });
      if (assignment.status !== "PENDING") return NextResponse.json({ message: "Assignment already processed" }, { status: 400 });

      // Monitor for rapid acceptance/rejection patterns
      await FraudDetectionService.monitorAssignmentPattern(vendorProfile.id, action as 'ACCEPT' | 'REJECT');

      if (action === "REJECT") {
        await prisma.$transaction(async (tx) => {
          await tx.bookingassignment.update({
            where: { id: assignment.id },
            data: { status: "REJECTED", notes: notes || "Rejected by vendor" }
          });

          // Trigger auto-reassign logic
          await inngest.send({
            name: "booking/vendor.rejected",
            data: { bookingId, vendorId: vendorProfile.id }
          });
        });
        return NextResponse.json({
            success: true,
            message: "Booking rejected",
            requestId: req.headers.get("x-request-id")
        });
      }

      if (action === "NEGOTIATE" && counterQuote) {
          const { TimelineService } = await import("@/services/server/timeline.service");
          const updated = await TimelineService.transitionStatus(
              bookingId,
              "NEGOTIATING",
              { id: payload.userId, name: vendorProfile.businessName, role: "VENDOR" },
              notes || `Counter-quote: ${counterQuote}`
          );

          // Note: Updating amount is a separate field not handled by transitionStatus yet
          await prisma.booking.update({
              where: { id: bookingId },
              data: { totalAmount: counterQuote }
          });

          return NextResponse.json({
              success: true,
              message: "Counter-quote sent",
              data: updated,
              requestId: req.headers.get("x-request-id")
          });
      }

      if (action === "ACCEPT") {
        // Double check booking status before proceeding
        const VALID_INITIAL_STATUSES: string[] = ["PENDING_VENDOR_RESPONSE", "COUNTERED"];
        if (!VALID_INITIAL_STATUSES.includes(booking.status)) {
           return NextResponse.json({ message: "Booking is no longer available" }, { status: 410 });
        }

        // Availability Check
        const existingOverlapping = await prisma.booking.findFirst({
            where: {
                vendorId: vendorProfile.id,
                status: "CONFIRMED",
                eventDate: booking.eventDate,
                // Add time window check if needed
            }
        });

        if (existingOverlapping) {
            return NextResponse.json({ message: "You already have a confirmed booking on this date" }, { status: 409 });
        }

        const updatedBooking = await prisma.$transaction(async (tx) => {
          // 1. Accept this assignment
          await tx.bookingassignment.update({
            where: { id: assignment.id },
            data: { status: "ACCEPTED" }
          });

          // 2. Reject others (if multi-vendor batch)
          await tx.bookingassignment.updateMany({
            where: { bookingId, id: { not: assignment.id }, status: "PENDING" },
            data: { status: "REJECTED", notes: "Automatically rejected: another vendor accepted" }
          });

          // 3. Update booking via State Machine
          const { TimelineService } = await import("@/services/server/timeline.service");
          const result = await TimelineService.transitionStatus(
              bookingId,
              "ACCEPTED" as any,
              { id: payload.userId, name: vendorProfile.businessName, role: "VENDOR" },
              "Vendor accepted the request",
              tx
          );

          // Ensure vendorId is set and status moved to payment pending
          await tx.booking.update({
              where: { id: bookingId },
              data: {
                  vendorId: vendorProfile.id,
                  status: "ADVANCE_PAYMENT_PENDING",
                  paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h to pay
              }
          });

          return result;
        });

        // Notify Customer
        emitSocketEvent(booking.customerprofile.userId, "BOOKING_ACCEPTED", {
            bookingId,
            vendorId: vendorProfile.id,
            businessName: vendorProfile.businessName
        });

        await inngest.send({
          name: "booking/confirmed",
          data: { bookingId, vendorId: vendorProfile.id }
        });

        await AuditService.logBooking(
          bookingId,
          "VENDOR_ACCEPT_BOOKING",
          { id: payload.userId, name: vendorProfile.businessName, role: payload.role },
          undefined,
          { ipAddress: req.headers.get("x-forwarded-for") || "unknown" }
        );

        return NextResponse.json({
            success: true,
            message: "Booking accepted successfully",
            data: updatedBooking,
            requestId: req.headers.get("x-request-id")
        });
      }
    } finally {
      // Release lock if we held it
      if (action === "ACCEPT" && redis) {
        const lockValue = await redis.get(lockKey);
        if (lockValue === vendorProfile.id) {
          await redis.del(lockKey);
        }
      }
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  });
}
