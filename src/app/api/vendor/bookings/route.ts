import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const bookings = await prisma.booking.findMany({
      where: { vendorprofile: { userId: payload.userId } },
      include: {
        user: { select: { fullName: true, mobileNumber: true, email: true } },
        bookingitem: { include: { service: true, Renamedpackage: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    try {
      const { bookingId, status, notes } = await req.json();

      const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { vendorprofile: true }
      });

      if (!booking || booking.vendorprofile.userId !== payload.userId) {
          return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status,
            bookingstatuslog: {
                create: {
                  id: crypto.randomUUID(),
                  status,
                  notes
                }
            }
        },
      });

      return NextResponse.json(updatedBooking);
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
  }
