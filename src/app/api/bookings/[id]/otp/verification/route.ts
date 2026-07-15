import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { sendSMS } from "@/lib/sms/twilio";
import logger from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";

import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/config/auth-limits";

// POST /api/bookings/[id]/otp/verification - Request OTP
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // Rate limit booking OTP requests
    const identifier = `booking-otp-send:${ip}:${payload.userId}:${id}`;
    const rateLimitResult = await rateLimit(identifier, AUTH_LIMITS.BOOKING_OTP);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult, "Too many OTP requests for this booking.");
    }

    logger.info("Requesting booking verification OTP", { bookingId: id, userId: payload.userId });

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: true, vendorprofile: { include: { user: true } } }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    const isCustomer = payload.userId === booking.customerId;
    const isVendor = payload.userId === booking.vendorprofile?.userId;

    if (!isCustomer && !isVendor) {
      logger.warn("Unauthorized OTP request attempt", { bookingId: id, userId: payload.userId });
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const targetUser = isCustomer ? booking.user : booking.vendorprofile?.user;

    if (!targetUser) {
        return NextResponse.json({ message: "Target user not found" }, { status: 404 });
    }

    const verificationData = (booking.checklist as Record<string, any>) || {};
    verificationData.phoneVerification = verificationData.phoneVerification || {};

    if (isCustomer) {
      verificationData.phoneVerification.customerOtp = otp;
      verificationData.phoneVerification.customerOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    } else {
      verificationData.phoneVerification.vendorOtp = otp;
      verificationData.phoneVerification.vendorOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    }

    await prisma.booking.update({
      where: { id },
      data: { checklist: verificationData }
    });

    await sendSMS(targetUser.mobileNumber, `Your Mana Events verification OTP is ${otp}. Valid for 10 minutes.`);

    return NextResponse.json({ message: "OTP sent successfully" });
  });
}

// PATCH /api/bookings/[id]/otp/verification - Verify OTP
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const body = await req.json();
    const { otp } = body;
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // Rate limit booking OTP verification
    const identifier = `booking-otp-verify:${ip}:${payload.userId}:${id}`;
    const rateLimitResult = await rateLimit(identifier, AUTH_LIMITS.BOOKING_VERIFY);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult, "Too many verification attempts.");
    }

    logger.info("Verifying booking verification OTP", { bookingId: id, userId: payload.userId });

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vendorprofile: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    const isCustomer = payload.userId === booking.customerId;
    const isVendor = payload.userId === booking.vendorprofile?.userId;

    const verificationData = (booking.checklist as Record<string, any>) || {};
    const phoneData = verificationData.phoneVerification || {};

    if (isCustomer) {
      if (phoneData.customerOtp !== otp) {
        logger.warn("Invalid customer OTP provided", { bookingId: id, userId: payload.userId });
        return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
      }
      if (new Date(phoneData.customerOtpExpiry) < new Date()) {
        logger.warn("Expired customer OTP provided", { bookingId: id, userId: payload.userId });
        return NextResponse.json({ message: "OTP Expired" }, { status: 400 });
      }

      await prisma.booking.update({
        where: { id },
        data: {
          checklist: { ...verificationData, customerPhoneVerified: true, phoneVerification: { ...phoneData, customerOtp: null } }
        }
      });
    } else if (isVendor) {
      if (phoneData.vendorOtp !== otp) {
        logger.warn("Invalid vendor OTP provided", { bookingId: id, userId: payload.userId });
        return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
      }
      if (new Date(phoneData.vendorOtpExpiry) < new Date()) {
        logger.warn("Expired vendor OTP provided", { bookingId: id, userId: payload.userId });
        return NextResponse.json({ message: "OTP Expired" }, { status: 400 });
      }

      await prisma.booking.update({
        where: { id },
        data: {
          checklist: { ...verificationData, vendorPhoneVerified: true, phoneVerification: { ...phoneData, vendorOtp: null } }
        }
      });
    } else {
      logger.warn("Unauthorized OTP verification attempt", { bookingId: id, userId: payload.userId });
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ message: "Phone verified successfully" });
  });
}
