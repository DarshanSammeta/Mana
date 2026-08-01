import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { emitSocketEvent } from "@/lib/socket-helper";
import { FraudDetectionService } from "@/services/server/fraud-detection.service";
import logger from "@/lib/logger";

import { BookingAuthService } from "@/lib/services/booking-auth.service";

// POST /api/bookings/[id]/location
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const { lat, lng, speed, heading } = await req.json();
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // 1. Authorization Check (Only Assigned Vendor)
    const isVendor = await BookingAuthService.isAssignedVendor(bookingId, payload.userId);
    if (!isVendor) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        customerprofile: { select: { userId: true } },
        status: true
      }
    });

    if (!booking || !booking.customerprofile) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // Only allow location updates if vendor is traveling
    if (booking.status !== "VENDOR_TRAVELING") {
        return NextResponse.json({ message: "Not in traveling state" }, { status: 400 });
    }

    // Fraud Detection: Check for GPS Spoofing
    const isSpoofing = await FraudDetectionService.detectGpsSpoofing(payload.userId, lat, lng, Date.now());
    if (isSpoofing) {
        logger.warn("GPS Spoofing suspected", { vendorId: payload.userId, lat, lng });
        // We still let the update through but it's logged in fraud_detection_log
    }

    // Emit live location update to customer
    emitSocketEvent(booking.customerprofile.userId, "vendor:location:update", {
        bookingId,
        lat,
        lng,
        speed,
        heading,
        timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  });
}
