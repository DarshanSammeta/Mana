import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";

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

    const { planId } = await req.json();
    const plan = await prisma.subscriptionplan.findUnique({ where: { id: planId } });

    if (!plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      include: { vendorsubscription: true }
    });

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    // Razorpay Order
    const razorpay = getRazorpay();
    const amount = Number(plan.price) * 100; // in paisa
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `sub_${Date.now()}`,
      notes: {
        vendorId: vendorProfile.id,
        planId: plan.id,
        type: "SUBSCRIPTION"
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Razorpay Order error:", error);
    return NextResponse.json({ message: "Failed to create order" }, { status: 500 });
  }
}
