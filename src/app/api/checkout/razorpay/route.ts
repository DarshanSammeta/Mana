import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { getServerSession } from "@/lib/auth-server";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

import { razorpayOrderSchema } from "@/validations";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const payload = await getServerSession(req);
    if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { amount, bookingId, currency, paymentType } = razorpayOrderSchema.parse(body);

    // Security: Validate Payment Milestone
    if (bookingId && paymentType === "BALANCE") {
        const { prisma } = await import("@/lib/prisma");
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { status: true }
        });

        if (!booking || booking.status !== "EVENT_COMPLETED") {
            return NextResponse.json({
                message: "Balance payment is only available after event completion."
            }, { status: 400 });
        }
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
        logger.error("Razorpay instance not available in API route");
        return NextResponse.json({ message: "Payment service unavailable" }, { status: 503 });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${bookingId || Date.now()}`,
      notes: {
        bookingId: bookingId,
        userId: payload.userId,
        paymentType: paymentType
      }
    };

    const order = await razorpay.orders.create(options as any);
    logger.info("Razorpay order created", { orderId: (order as any).id, userId: payload.userId, bookingId });
    return NextResponse.json(order);
  }, req);
}
