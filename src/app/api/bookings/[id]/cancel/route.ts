import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { inngest } from "@/lib/inngest";

import { cancelBookingSchema } from "@/validations/booking";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const body = await req.json();
    const { reason } = cancelBookingSchema.parse(body);
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vendorprofile: true, customerprofile: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // Authorization: Either Customer or assigned Vendor can cancel (with different rules usually)
    const isCustomer = booking.customerprofile.userId === payload.userId;
    const isVendor = booking.vendorprofile?.userId === payload.userId;

    if (!isCustomer && !isVendor) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { TimelineService } = await import("@/services/server/timeline.service");
    const updatedBooking = await TimelineService.transitionStatus(
        bookingId,
        "CANCELLED",
        { id: payload.userId, name: (payload as any).fullName || "User", role: payload.role },
        reason
    );

    // Side effect: If advance was paid, initiate refund process
    if (booking.advancePaidAt) {
        await inngest.send({
            name: "booking/refund.initiate",
            data: {
                bookingId,
                reason: `Cancelled by ${payload.role}: ${reason}`,
                isSystemAction: false
            }
        });
    }

    return NextResponse.json({
        success: true,
        message: "Booking cancelled successfully",
        data: updatedBooking
    });
  });
}
