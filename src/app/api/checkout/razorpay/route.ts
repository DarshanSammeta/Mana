import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { amount, bookingId, currency = "INR" } = await req.json();
    const razorpay = getRazorpay();

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
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
