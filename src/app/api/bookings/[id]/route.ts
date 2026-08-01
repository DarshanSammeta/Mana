import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const resolvedParams = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    logger.info("Fetching specific booking details", { bookingId: resolvedParams.id, userId: payload.userId });

    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        bookingNumber: true,
        customerProfileId: true,
        vendorId: true,
        eventDate: true,
        eventTime: true,
        eventLocation: true,
        landmark: true,
        city: true,
        state: true,
        pincode: true,
        guestCount: true,
        totalAmount: true,
        subTotal: true,
        taxAmount: true,
        status: true,
        specialInstructions: true,
        otp: true,
        eventName: true,
        eventType: true,
        eventDescription: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
        vendorprofile: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            city: true,
            state: true,
            userId: true
          }
        },
        customerprofile: {
          select: {
            user: {
              select: { id: true, fullName: true, email: true, mobileNumber: true },
            }
          }
        },
        bookingitem: {
          select: {
            id: true,
            serviceId: true,
            packageId: true,
            price: true,
            quantity: true,
            service: {
              select: {
                id: true,
                title: true,
                basePrice: true
              }
            },
            Renamedpackage: {
              select: {
                id: true,
                name: true,
                price: true
              }
            },
          },
        },
        bookingstatuslog: {
          select: {
            id: true,
            status: true,
            notes: true,
            createdAt: true
          },
          orderBy: { createdAt: "desc" }
        }
      },
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // Resolve customerProfileId for authorization if it's a customer
    if (payload.role === "CUSTOMER") {
        const profile = await prisma.customerprofile.findUnique({
            where: { userId: payload.userId },
            select: { id: true }
        });
        if (!profile || booking.customerProfileId !== profile.id) {
            logger.warn("Unauthorized access attempt to booking", { bookingId: resolvedParams.id, userId: payload.userId });
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }
    }

    if (payload.role === "VENDOR" && booking.vendorprofile?.userId !== payload.userId) {
        logger.warn("Unauthorized vendor access attempt to booking", { bookingId: resolvedParams.id, userId: payload.userId });
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Flatten for frontend compatibility if needed
    const transformedBooking = {
        ...booking,
        user: (booking as any).customerprofile?.user
    };

    // --- STEP 11: SAFETY & TRUST FEATURES ---
    // Hide address from vendor until Event Day unless already started
    const isEventDay = new Date().toDateString() === new Date(transformedBooking.eventDate).toDateString();
    const canSeeAddress = payload.role === "CUSTOMER" ||
                          isEventDay ||
                          ["VENDOR_TRAVELING", "VENDOR_ARRIVED", "EVENT_STARTED", "EVENT_ONGOING", "EVENT_COMPLETED"].includes(transformedBooking.status);

    if (payload.role === "VENDOR" && !canSeeAddress) {
      transformedBooking.eventLocation = "Address will be visible on the event day";
      transformedBooking.landmark = "Hidden";
      transformedBooking.latitude = null;
      transformedBooking.longitude = null;
    }

    return NextResponse.json(transformedBooking);
  });
}
