import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { createAuditLog } from "@/lib/audit";
import { inngest } from "@/lib/inngest";
import { emitSocketEvent } from "@/lib/socket-helper";
import { getIoRedis } from "@/lib/redis";
import { FraudDetectionService } from "@/services/server/fraud-detection.service";

// PATCH /api/bookings/[id]/accept
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const { action, notes, counterQuote } = await req.json(); // action: 'ACCEPT' | 'REJECT' | 'NEGOTIATE'
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });
    if (!vendorProfile) return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingassignment: true }
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
        return NextResponse.json({ message: "Booking rejected" });
      }

      if (action === "NEGOTIATE" && counterQuote) {
          await prisma.booking.update({
              where: { id: bookingId },
              data: {
                  status: "NEGOTIATING",
                  totalAmount: counterQuote,
                  bookingstatuslog: {
                      create: {
                          id: crypto.randomUUID(),
                          status: "NEGOTIATING",
                          notes: notes || `Counter-quote: ${counterQuote}`
                      }
                  }
              }
          });
          // Notify customer
          emitSocketEvent(booking.customerId, "BOOKING_UPDATED", { bookingId, status: "NEGOTIATING" });
          return NextResponse.json({ message: "Counter-quote sent" });
      }

      if (action === "ACCEPT") {
        // Double check booking status before proceeding
        if (booking.status !== "SEARCHING" && (booking.status as string) !== "CREATED") {
           return NextResponse.json({ message: "Booking is no longer available" }, { status: 410 });
        }

        const updatedBooking = await prisma.$transaction(async (tx) => {
          // 1. Accept this assignment
          await tx.bookingassignment.update({
            where: { id: assignment.id },
            data: { status: "ACCEPTED" }
          });

          // 2. Reject others
          await tx.bookingassignment.updateMany({
            where: { bookingId, id: { not: assignment.id }, status: "PENDING" },
            data: { status: "REJECTED", notes: "Automatically rejected: another vendor accepted" }
          });

          // 3. Update booking
          const updated = await tx.booking.update({
            where: { id: bookingId },
            data: {
              vendorId: vendorProfile.id,
              status: "CONFIRMED",
              bookingstatuslog: {
                create: [
                  { id: crypto.randomUUID(), status: "QUOTE_ACCEPTED", notes: "Vendor accepted the request" },
                  { id: crypto.randomUUID(), status: "CONFIRMED", notes: "Booking confirmed with vendor" }
                ]
              }
            }
          });

          return updated;
        });

        // Notify Customer
        emitSocketEvent(booking.customerId, "BOOKING_ACCEPTED", {
            bookingId,
            vendorId: vendorProfile.id,
            businessName: vendorProfile.businessName
        });

        await inngest.send({
          name: "booking/confirmed",
          data: { bookingId, vendorId: vendorProfile.id }
        });

        await createAuditLog({
          userId: payload.userId,
          action: "VENDOR_ACCEPT_BOOKING",
          details: { bookingId },
          ipAddress: req.headers.get("x-forwarded-for") || "unknown"
        });

        return NextResponse.json(updatedBooking);
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
