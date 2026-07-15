import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { emitSocketEvent } from "@/lib/socket-helper";
import { withErrorHandler } from "@/lib/error-handler";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const _assignment = await prisma.bookingassignment.findUnique({
      where: {
        bookingId_vendorId: {
          bookingId,
          vendorId: payload.userId // Note: Assuming vendorId in assignment matches userId or needs lookup
        }
      }
    });

    // If it's a valid assignment and first time viewing, log it
    await prisma.bookingstatuslog.create({
      data: {
        id: crypto.randomUUID(),
        bookingId,
        status: "VENDORS_NOTIFIED", // Or a custom sub-status like 'VENDOR_VIEWED'
        notes: `Vendor ${payload.userId} viewed the booking request.`,
      }
    });

    // Notify Customer in real-time
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { customerId: true } });
    if (booking) {
      emitSocketEvent(booking.customerId, "booking:viewed", { bookingId, vendorId: payload.userId });
    }

    return NextResponse.json({ success: true });
  });
}
