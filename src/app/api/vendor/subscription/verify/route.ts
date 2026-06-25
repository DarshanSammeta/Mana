import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId
    } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    const plan = await prisma.subscriptionplan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ message: "Plan not found" }, { status: 404 });

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });
    if (!vendorProfile) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    // Update or create subscription
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const subscription = await prisma.vendorsubscription.upsert({
      where: { vendorProfileId: vendorProfile.id },
      update: {
        planId: plan.id,
        startDate: new Date(),
        endDate: endDate,
        status: "ACTIVE",
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        vendorProfileId: vendorProfile.id,
        planId: plan.id,
        startDate: new Date(),
        endDate: endDate,
        status: "ACTIVE",
        updatedAt: new Date(),
      }
    });

    // Record Payment
    await prisma.subscriptionpayment.create({
      data: {
        id: crypto.randomUUID(),
        subscriptionId: subscription.id,
        amount: plan.price,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "SUCCESS",
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ message: "Subscription activated successfully" });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
