import { RAZORPAY_CONFIG } from "@/config/razorpay";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { AuditService } from "@/services/server/audit.service";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  // Fix: Ensure rateLimit is used with await if it's async, or check usage
  // The existing implementation was synchronous or handled via middleware

  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = await verifyAccessToken(token);
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
      await AuditService.log({
        entityType: "PAYMENT",
        entityId: razorpay_order_id,
        bookingId,
        module: "FINANCE",
        action: "PAYMENT_VERIFICATION_FAILED",
        performedByUserId: payload.userId,
        performedByRole: payload.role,
        metadata: { razorpay_order_id, bookingId, reason: "Invalid signature" },
        ipAddress: ip
      });
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    // Bug Fix: Query via customerprofile instead of dropped customerId
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        customerprofile: {
          select: { userId: true }
        },
        payment: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!existingBooking || existingBooking.customerprofile.userId !== payload.userId) {
       return NextResponse.json({ message: "Unauthorized booking access" }, { status: 403 });
    }

    const existingPayment = await prisma.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id }
    });

    if (existingPayment && existingPayment.status === "SUCCESS") {
        return NextResponse.json({ success: true, message: "Payment already verified" });
    }

    await prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "SUCCESS",
        updatedAt: new Date(),
      },
    });

    const { TimelineService } = await import("@/services/server/timeline.service");
    await TimelineService.transitionStatus(
        bookingId,
        "CONFIRMED",
        { id: payload.userId, name: (payload as any).fullName || "Customer", role: payload.role },
        "Payment verified via Razorpay"
    );

    return NextResponse.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    logger.error("Payment Verification Error", { error });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}
