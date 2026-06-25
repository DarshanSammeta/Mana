import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id },
      include: {
        vendorprofile: true,
        user: {
          select: { id: true, fullName: true, email: true, mobileNumber: true },
        },
        bookingitem: {
          include: {
            service: true,
            Renamedpackage: true,
          },
        },
        bookingstatuslog: {
            orderBy: { createdAt: "desc" }
        }
      },
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // Check if user is authorized to see this booking
    if (payload.role === "CUSTOMER" && booking.customerId !== payload.userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    if (payload.role === "VENDOR" && booking.vendorprofile.userId !== payload.userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
