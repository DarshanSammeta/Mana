import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { amount, bookingId, currency = "INR" } = await req.json();
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
        userId: payload.userId
      }
    };

    const order = await razorpay.orders.create(options);
    logger.info("Razorpay order created", { orderId: order.id, userId: payload.userId, bookingId });
    return NextResponse.json(order);
  }, req);
}
