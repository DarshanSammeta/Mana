import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";
import { withErrorHandler } from "@/lib/error-handler";
import { OrderService } from "@/services/server/order.service";

export async function POST(req: Request) {
  const start = performance.now();
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withErrorHandler(async () => {
    const payload = await getServerSession(req);

    if (!payload || (payload.role !== "CUSTOMER" && payload.role !== "VENDOR")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const profile = await prisma.customerprofile.findUnique({
      where: { userId: payload.userId }
    });

    if (!profile) {
        return NextResponse.json({ message: "Customer profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const idempotencyKey = body.idempotencyKey || req.headers.get("x-idempotency-key");

    // Delegate to enterprise OrderService
    const order = await OrderService.createOrder(profile.id, {
        items: body.items,
        eventDetails: body.eventDetails,
        couponCode: body.couponCode,
        idempotencyKey
    });

    const totalTime = performance.now() - start;
    console.log(`[CHECKOUT API] Success | RID: ${requestId} | Total: ${totalTime.toFixed(2)}ms`);

    return NextResponse.json({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        amounts: {
            total: order.totalAmount,
            advance: order.advanceAmount,
            balance: order.balanceAmount
        },
        reservationExpiresAt: order.reservations?.[0]?.expiresAt
    }, { status: 201 });
  }, req);
}
