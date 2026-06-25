import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "CUSTOMER") return NextResponse.json({ status: 403 });

  try {
    const userId = payload.userId;

    const bookings = await prisma.booking.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        vendorprofile: {
          select: { businessName: true, logo: true }
        },
        bookingitem: {
          include: {
            service: { select: { title: true } }
          }
        }
      }
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
