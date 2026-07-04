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
      select: {
        id: true,
        bookingNumber: true,
        customerId: true,
        vendorId: true,
        eventDate: true,
        eventTime: true,
        eventLocation: true,
        landmark: true,
        city: true,
        state: true,
        pincode: true,
        eventName: true,
        eventType: true,
        eventDescription: true,
        guestCount: true,
        totalAmount: true,
        subTotal: true,
        taxAmount: true,
        status: true,
        specialInstructions: true,
        latitude: true,
        longitude: true,
        createdAt: true,
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
          select: {
            id: true,
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
            id: true,
            amount: true,
            status: true,
            method: true,
            razorpayPaymentId: true,
            createdAt: true
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            pdfUrl: true,
          }
        },
        dispute: {
          select: {
            id: true,
            reason: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // Security check: only the customer who made the booking can see it
    if (booking.customerId !== payload.userId && payload.role !== "ADMIN") {
      return NextResponse.json({ status: 403 });
    }

    // Mask exact location unless it's event day (Step 8: Privacy & Security)
    const isEventDay = new Date().toDateString() === new Date(booking.eventDate).toDateString();
    const isTraveling = booking.status === "VENDOR_TRAVELING" || booking.status === "VENDOR_ARRIVED";

    const responseData = {
      ...booking,
      eventLocation: (isEventDay || isTraveling) ? booking.eventLocation : "Unlocked on event day",
      latitude: (isEventDay || isTraveling) ? booking.latitude : null,
      longitude: (isEventDay || isTraveling) ? booking.longitude : null,
      invoiceUrl: booking.invoice?.pdfUrl || null
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
