import { RAZORPAY_CONFIG } from "@/config/razorpay";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { sendSMS } from "@/lib/sms/twilio";
import { sendBookingConfirmationEmail } from "@/lib/mail/resend";
import { format } from "date-fns";
import { createAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(ip, { limit: 5, window: 60000 })) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = await req.json();

    const secret = RAZORPAY_CONFIG.keySecret!;

    const isValid = validatePaymentVerification(
      { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      secret
    );

    if (!isValid) {
      await createAuditLog({
        userId: payload.userId,
        action: "PAYMENT_VERIFICATION_FAILED",
        details: { razorpay_order_id, bookingId, reason: "Invalid signature" },
        ipAddress: ip
      });
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    // Verify booking ownership and existence
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        customerId: true,
        payment: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!existingBooking || existingBooking.customerId !== payload.userId) {
       return NextResponse.json({ message: "Unauthorized booking access" }, { status: 403 });
    }

    // Check if payment already processed (prevent replay)
    const existingPayment = await prisma.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id }
    });

    if (existingPayment && existingPayment.status === "SUCCESS") {
        return NextResponse.json({ success: true, message: "Payment already verified" });
    }

    // Update payment record
    await prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "SUCCESS",
        updatedAt: new Date(),
      },
    });

    // Update booking status
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        updatedAt: new Date(),
      },
      select: {
        id: true,
        bookingNumber: true,
        totalAmount: true,
        eventName: true,
        eventDate: true,
        user: {
          select: {
            email: true,
            mobileNumber: true,
            fullName: true
          }
        }
      }
    });

    await createAuditLog({
        userId: payload.userId,
        action: "PAYMENT_SUCCESS",
        details: { bookingId, amount: booking.totalAmount.toString() },
        ipAddress: ip
    });

    // Send Confirmation SMS
    try {
      await sendSMS(
        booking.user.mobileNumber,
        `Payment Successful! Your booking ${booking.bookingNumber} is now CONFIRMED. View details: ${process.env.NEXT_PUBLIC_APP_URL}/customer/bookings/${booking.id}`
      );
    } catch (smsError) {
      logger.error("Failed to send payment confirmation SMS", { error: smsError, bookingId });
    }

    // Send Confirmation Email
    try {
      await sendBookingConfirmationEmail(booking.user.email, {
        customerName: booking.user.fullName,
        bookingNumber: booking.bookingNumber,
        eventName: booking.eventName || "Event",
        eventDate: format(new Date(booking.eventDate), "PPP"),
        totalAmount: `₹${booking.totalAmount}`,
      });
    } catch (emailError) {
      logger.error("Failed to send booking confirmation email", { error: emailError, bookingId });
    }

    // Log status change
    await prisma.bookingstatuslog.create({
      data: {
        id: crypto.randomUUID(),
        bookingId: bookingId,
        status: "CONFIRMED",
        notes: "Payment verified via Razorpay",
      },
    });

    return NextResponse.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    logger.error("Payment Verification Error", { error });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}
