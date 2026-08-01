import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { OrderService } from "@/services/server/order.service";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "CUSTOMER") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const profile = await prisma.customerprofile.findUnique({
      where: { userId: payload.userId }
    });
    if (!profile) return NextResponse.json({ message: "Customer profile not found" }, { status: 404 });

    const body = await req.json();

    // Use the OrderService to create the order
    // This now supports multi-item checkout
    const order = await OrderService.createOrder(profile.id, {
        items: body.items,
        eventDetails: body.eventDetails,
        couponCode: body.couponCode,
        idempotencyKey: body.idempotencyKey
    });

    return NextResponse.json(order, { status: 201 });
  }, req);
}
