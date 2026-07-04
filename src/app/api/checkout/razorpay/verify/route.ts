import { RAZORPAY_CONFIG } from "@/config/razorpay";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import crypto from "crypto";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { processSuccessfulPayment } from "@/lib/payments";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_CONFIG.keySecret!)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
       // Fetch full payment details from Razorpay to ensure we have all notes
       const razorpay = getRazorpay();
       const payment = await razorpay.payments.fetch(razorpay_payment_id);

       // Force notes if missing (defensive)
       payment.notes = payment.notes || {};
       payment.notes.bookingId = bookingId;

       await processSuccessfulPayment(payment);

      logger.info("Payment verified successfully", { bookingId, paymentId: razorpay_payment_id });
      return NextResponse.json({ message: "Payment verified successfully" });
    } else {
      logger.error("Payment verification failed: Invalid signature", { orderId: razorpay_order_id });
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }
  });
}
