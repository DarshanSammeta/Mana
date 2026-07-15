import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // Fetch all bookings where vendor is traveling or arrived (live events)
    const liveBookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ["VENDOR_TRAVELING", "VENDOR_ARRIVED", "EVENT_STARTED", "EVENT_ONGOING"]
        }
      },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        eventName: true,
        eventLocation: true,
        latitude: true,
        longitude: true,
        vendorprofile: {
          select: {
            id: true,
            businessName: true,
            userId: true
          }
        },
        user: {
          select: {
            fullName: true,
            mobileNumber: true
          }
        }
      }
    });

    return NextResponse.json(liveBookings);
  });
}
