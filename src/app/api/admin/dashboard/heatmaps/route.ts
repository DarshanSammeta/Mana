import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ status: 403 });

    // Fetch coordinates for bookings and vendors
    const [bookings, vendors] = await Promise.all([
      prisma.booking.findMany({
        where: { status: { not: "CANCELLED" } },
        select: { latitude: true, longitude: true }
      }),
      prisma.vendorprofile.findMany({
        where: { verificationStatus: "APPROVED" },
        select: { latitude: true, longitude: true }
      })
    ]);

    return NextResponse.json({
      bookings: bookings.map(b => ({ lat: Number(b.latitude), lng: Number(b.longitude) })),
      vendors: vendors.map(v => ({ lat: Number(v.latitude), lng: Number(v.longitude) }))
    });
  }, req);
}
