import { NextResponse } from "next/server";
import { TimelineService } from "@/services/server/timeline.service";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAccessToken } from "@/lib/auth";
import { BookingAuthService } from "@/lib/services/booking-auth.service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ status: 403 });

    const canAccess = await BookingAuthService.canAccess(bookingId, payload.userId, payload.role);
    if (!canAccess) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const timeline = await TimelineService.getBookingTimeline(bookingId);
    return NextResponse.json(timeline);
  }, req);
}
