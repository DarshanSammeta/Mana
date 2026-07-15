import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { totalAmount, notes } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vendorprofile: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (!booking.vendorprofile || booking.vendorprofile.userId !== payload.userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        totalAmount,
        status: "NEGOTIATING",
        bookingstatuslog: {
          create: {
            id: crypto.randomUUID(),
            status: "NEGOTIATING",
            notes: notes || `Counter-quote sent: ${totalAmount}`
          }
        }
      }
    });

    // Notify customer
    try {
      const { NotificationTriggers } = await import("@/lib/notifications");
      await NotificationTriggers.bookingStatusUpdated(booking, "NEGOTIATING");
    } catch (err) {
      logger.error("Negotiation notification error", err);
    }

    return NextResponse.json(updatedBooking);
  }, req);
}
