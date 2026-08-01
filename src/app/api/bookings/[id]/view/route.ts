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

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true, businessName: true }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });

    const _assignment = await prisma.bookingassignment.findUnique({
      where: {
        bookingId_vendorId: {
          bookingId,
          vendorId: vendorProfile.id
        }
      }
    });

    if (!_assignment) return NextResponse.json({ message: "Unauthorized assignment access" }, { status: 403 });

    // 2. Timeline Update via unified service (sub-status view)
    const { TimelineService } = await import("@/services/server/timeline.service");
    await TimelineService.addTimelineEntry(bookingId, {
        title: "Vendor Viewed Request",
        description: `${vendorProfile.businessName} is reviewing your booking request.`,
        performedBy: vendorProfile.businessName,
        role: "VENDOR",
        icon: "Eye",
        color: "blue"
    });

    // Notify Customer in real-time
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { customerprofile: true }
    });
    if (booking) {
      emitSocketEvent(booking.customerprofile.userId, "booking:viewed", { bookingId, vendorId: payload.userId });
    }

    return NextResponse.json({ success: true });
  });
}
