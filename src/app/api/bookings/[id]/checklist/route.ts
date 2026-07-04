import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden - Only vendors can update checklists" }, { status: 403 });
    }

    const { checklist } = await req.json(); // Expected: Array of { id: number, task: string, completed: boolean }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vendorprofile: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.vendorprofile?.userId !== payload.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        checklist: checklist || [],
        bookingstatuslog: {
          create: {
            id: crypto.randomUUID(),
            status: booking.status,
            notes: "Vendor updated the event checklist."
          }
        }
      }
    });

    return NextResponse.json({ message: "Checklist updated successfully", checklist: updatedBooking.checklist });
  });
}
