import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ status: 403 });

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const bookings = await prisma.booking.findMany({
      where: {
        vendorId: vendorProfile.id,
        eventDate: {
            gte: start ? new Date(start) : undefined,
            lte: end ? new Date(end) : undefined
        },
        status: { notIn: ["DRAFT", "PENDING_ADVANCE", "CANCELLED", "REJECTED"] }
      },
      select: {
          id: true,
          bookingNumber: true,
          eventName: true,
          eventDate: true,
          status: true
      }
    });

    return NextResponse.json(bookings);
  }, req);
}
