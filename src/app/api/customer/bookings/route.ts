import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { booking_status } from "@prisma/client";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "CUSTOMER") return NextResponse.json({ status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const userId = payload.userId;

    const whereClause: any = { customerId: userId };
    if (status && status !== 'ALL') {
      whereClause.status = status as booking_status;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bookingNumber: true,
        eventName: true,
        eventDate: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        vendorprofile: {
          select: {
            businessName: true,
            logo: true,
            city: true,
            state: true
          }
        },
        bookingitem: {
          select: {
            price: true,
            quantity: true,
            service: {
              select: { title: true }
            },
            Renamedpackage: {
              select: { name: true }
            }
          }
        },
        payment: {
          select: {
            status: true,
            amount: true,
            createdAt: true
          }
        }
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
