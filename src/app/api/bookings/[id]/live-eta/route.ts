import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDetailedDistance } from "@/lib/maps/googleMaps";
import { safeRedis } from "@/lib/redis";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vendorprofile: true }
    });

    if (!booking || !booking.vendorId) {
      return NextResponse.json({ message: "Booking or Vendor not found" }, { status: 404 });
    }

    // Get live location from Redis
    const locationData = await safeRedis.get<string>(`vendor:location:${booking.vendorId}`);
    if (!locationData) {
      return NextResponse.json({ message: "Vendor location unavailable" }, { status: 404 });
    }

    const { lat, lng, speed, timestamp } = JSON.parse(locationData);

    // Target location is the booking event address/coords
    const destination = {
      lat: Number(booking.latitude),
      lng: Number(booking.longitude)
    };

    const etaData = await calculateDetailedDistance(
      { lat, lng },
      destination
    );

    if (!etaData) {
      return NextResponse.json({ message: "Could not calculate ETA" }, { status: 500 });
    }

    return NextResponse.json({
      distanceRemainingKm: etaData.distanceKm,
      etaMinutes: Math.ceil(etaData.durationSec / 60),
      trafficDelayMinutes: Math.ceil(etaData.trafficDelaySec / 60),
      currentSpeedKph: speed || 0,
      lastUpdated: timestamp,
      vendorLocation: { lat, lng }
    });
  });
}
