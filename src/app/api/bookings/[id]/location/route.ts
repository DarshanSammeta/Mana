import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { latitude, longitude } = await req.json();
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vendorprofile: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.vendorprofile.userId !== payload.userId) return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    // Store in location tracking log
    await prisma.locationtrackinglog.create({
      data: {
        id: crypto.randomUUID(),
        userId: payload.userId,
        latitude,
        longitude,
        source: `BOOKING_${id}`,
        createdAt: new Date()
      }
    });

    // Also update the booking's last known location for quick access
    await prisma.booking.update({
      where: { id },
      data: {
        latitude,
        longitude,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vendorprofile: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.customerId !== payload.userId && booking.vendorprofile.userId !== payload.userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Only allow tracking on event day and if status is VENDOR_TRAVELING or VENDOR_ARRIVED
    const isEventDay = new Date().toDateString() === new Date(booking.eventDate).toDateString();
    if (!isEventDay || (booking.status !== "VENDOR_TRAVELING" && booking.status !== "VENDOR_ARRIVED")) {
      return NextResponse.json({ message: "Tracking not available yet" }, { status: 400 });
    }

    const latestLocation = await prisma.locationtrackinglog.findFirst({
      where: { userId: booking.vendorprofile.userId, source: `BOOKING_${id}` },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(latestLocation);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
