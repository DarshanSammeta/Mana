import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const bookings = await prisma.booking.findMany({
      where: { vendorprofile: { userId: payload.userId } },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        totalAmount: true,
        eventDate: true,
        eventLocation: true,
        createdAt: true,
        customerprofile: {
          select: {
            user: {
              select: { fullName: true, mobileNumber: true }
            }
          }
        },
        bookingitem: {
          select: {
            id: true,
            service: { select: { title: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    // Flatten for compatibility
    const transformedBookings = bookings.map(b => ({
      ...b,
      user: b.customerprofile?.user
    }));

    return NextResponse.json(transformedBookings);
  } catch (error) {
    logger.error("Vendor Recent Bookings GET Error", { error });
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
