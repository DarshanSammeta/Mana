import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ status: 403 });

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vendorprofile: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            description: true,
            address: true,
            city: true,
            state: true
          }
        },
        bookingitem: {
          include: {
            service: {
              select: { title: true }
            },
            Renamedpackage: {
              select: { name: true }
            }
          }
        },
        payment: true,
        invoice: true,
        dispute: true
      }
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // Security check: only the customer who made the booking can see it
    if (booking.customerId !== payload.userId && payload.role !== "ADMIN") {
      return NextResponse.json({ status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
