import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "CUSTOMER") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { reason, amount } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id },
      include: { payment: true, customerprofile: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.customerprofile.userId !== payload.userId) return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    // Check if a refund already exists
    const existingRefund = await prisma.refund.findUnique({
      where: { bookingId: resolvedParams.id }
    });

    if (existingRefund) return NextResponse.json({ message: "Refund already requested" }, { status: 400 });

    const refund = await prisma.$transaction(async (tx) => {
        const result = await tx.refund.create({
            data: {
                id: crypto.randomUUID(),
                bookingId: resolvedParams.id,
                amount: amount || booking.totalAmount,
                reason,
                status: 'REQUESTED'
            }
        });

        // Update booking status via State Machine
        const { TimelineService } = await import("@/services/server/timeline.service");
        await TimelineService.transitionStatus(
            resolvedParams.id,
            "CANCELLED",
            { id: payload.userId, name: (payload as any).fullName || "Customer", role: payload.role },
            `Refund Requested: ${reason}`,
            tx
        );

        return result;
    });

    return NextResponse.json(refund);
  } catch (error) {
    logger.error("Error processing refund request", { error, bookingId: resolvedParams.id });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
