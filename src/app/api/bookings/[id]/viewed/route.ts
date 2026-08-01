import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vendorprofile: true }
    });

    if (!booking || booking.vendorprofile?.userId !== payload.userId) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    if (!booking.viewedByVendor) {
        await prisma.booking.update({
            where: { id: bookingId },
            data: { viewedByVendor: true }
        });

        const { TimelineService } = await import("@/services/server/timeline.service");
        await TimelineService.addTimelineEntry(bookingId, {
            title: "Vendor Viewed Request",
            description: "The vendor has opened and reviewed your booking request.",
            performedBy: booking.vendorprofile.businessName,
            role: "VENDOR",
            icon: "Eye",
            color: "slate"
        });
    }

    return NextResponse.json({ success: true });
  });
}
