import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";
import { NotificationTriggers } from "@/lib/notifications";

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
        eventTime: true,
        eventLocation: true,
        createdAt: true,
        user: { select: { fullName: true, mobileNumber: true, email: true } },
        bookingitem: {
          select: {
            id: true,
            price: true,
            quantity: true,
            service: { select: { id: true, title: true } },
            Renamedpackage: { select: { id: true, name: true } }
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            method: true
          }
        },
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(bookings);
  } catch (error) {
    logger.error("Vendor Bookings GET Error", { error });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
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
          select: {
            vendorprofile: {
              select: { userId: true }
            }
          }
      });

      if (!booking || booking.vendorprofile?.userId !== payload.userId) {
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
        include: {
            vendorprofile: true,
            user: true
        }
      });

      // Notify customer of status change
      await NotificationTriggers.bookingStatusUpdated(updatedBooking, status);

      return NextResponse.json(updatedBooking);
    } catch (error) {
      logger.error("Vendor Bookings PATCH Error", { error });
      return NextResponse.json(
        { message: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 400 }
      );
    }
  }
