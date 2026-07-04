import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { rateLimit } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Rate limit payment order creation
    const limit = await rateLimit(`payment-order-${ip}`, { limit: 5, window: 60 });
    if (!limit.success) {
      logger.warn("Rate limit exceeded for payment order creation", { ip });
      return NextResponse.json({ message: "Too many requests" }, { status: 429 });
    }

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { amount, currency = "INR" } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    const razorpay = getRazorpay();

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit
      currency,
      receipt: `receipt_${Date.now()}_${payload.userId.slice(0, 8)}`,
    };

    logger.info("Creating Razorpay order", { userId: payload.userId, amount: options.amount });

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  });
}
