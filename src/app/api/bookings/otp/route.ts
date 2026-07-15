import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { sendOTP } from "@/lib/sms/twilio";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/config/auth-limits";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { bookingId } = await req.json();

    // Rate limit check-in OTP requests
    const identifier = `checkin-otp-send:${ip}:${payload.userId}:${bookingId}`;
    const rateLimitResult = await rateLimit(identifier, AUTH_LIMITS.BOOKING_OTP);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult, "Too many OTP requests.");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.customerId !== payload.userId) {
        return NextResponse.json({ message: "Only customer can generate OTP" }, { status: 403 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.eventcheckin.upsert({
      where: { bookingId },
      update: { otp, generatedAt: new Date(), verifiedAt: null, status: "PENDING" },
      create: { id: crypto.randomUUID(), bookingId, otp, status: "PENDING" }
    });

    // Send OTP via SMS
    try {
      await sendOTP(booking.user.mobileNumber, otp);
    } catch (smsError) {
      logger.error("Failed to send OTP SMS", { error: smsError, bookingId, mobile: booking.user.mobileNumber });
    }

    return NextResponse.json({ message: "OTP generated and sent successfully" });
  });
}

export async function PATCH(req: Request) {
  return withErrorHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { bookingId, otp } = await req.json();

    // Rate limit check-in OTP verification
    const identifier = `checkin-otp-verify:${ip}:${payload.userId}:${bookingId}`;
    const rateLimitResult = await rateLimit(identifier, AUTH_LIMITS.BOOKING_VERIFY);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult, "Too many verification attempts.");
    }

    const checkin = await prisma.eventcheckin.findUnique({
      where: { bookingId },
      include: { booking: { include: { vendorprofile: true } } }
    });

    if (!checkin) return NextResponse.json({ message: "Check-in record not found" }, { status: 404 });
    if (!checkin.booking.vendorprofile || checkin.booking.vendorprofile.userId !== payload.userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (checkin.otp !== otp) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    await prisma.eventcheckin.update({
      where: { bookingId },
      data: { verifiedAt: new Date(), status: "SUCCESS" }
    });

    // Update booking status
    await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: "EVENT_STARTED",
            bookingstatuslog: {
                create: {
                  id: crypto.randomUUID(),
                  status: "EVENT_STARTED",
                  notes: "OTP Verified. Event started."
                }
            }
        }
    });

    return NextResponse.json({ message: "OTP verified. Event started!" });
  });
}
