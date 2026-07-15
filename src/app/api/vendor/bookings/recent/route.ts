import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
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
        user: { select: { fullName: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });
    return NextResponse.json(bookings);
  } catch (error) {
    logger.error("Vendor Recent Bookings GET Error", { error });
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
