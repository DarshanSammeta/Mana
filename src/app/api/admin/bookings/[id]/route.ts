import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customerprofile: {
          include: { user: { select: { fullName: true, email: true, mobileNumber: true } } }
        },
        vendorprofile: {
          select: { id: true, businessName: true, city: true, state: true }
        },
        bookingitem: {
            include: {
                service: true,
                Renamedpackage: true
            }
        },
        bookingstatuslog: {
            orderBy: { createdAt: "desc" }
        },
        booking_timeline: {
            orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // Format for Admin BFF expectation
    const data = {
        ...booking,
        customer: booking.customerprofile.user.fullName,
        customer_email: booking.customerprofile.user.email,
        customer_phone: booking.customerprofile.user.mobileNumber,
        vendor_name: booking.vendorprofile?.businessName || "—",
        status: booking.status.toLowerCase(),
        amount: Number(booking.totalAmount),
        created_at: booking.createdAt,
        event_type: booking.eventType
    };

    return NextResponse.json(data);
  }, req);
}
