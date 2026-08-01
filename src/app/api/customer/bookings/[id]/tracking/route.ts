import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

import { BookingAuthService } from "@/lib/services/booking-auth.service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ status: 403 });

    // 1. Authorization Check
    const canAccess = await BookingAuthService.canAccess(bookingId, payload.userId, payload.role);
    if (!canAccess) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vendorprofile: {
          select: {
            businessName: true,
            logo: true,
            rating: true,
            city: true
          }
        },
        booking_timeline: {
            orderBy: { createdAt: "desc" }
        },
        booking_team_assignment: {
            include: {
                member: true
            }
        },
        booking_checklist: {
            orderBy: { createdAt: "asc" }
        },
        booking_document: {
            orderBy: { createdAt: "desc" }
        },
        payment: {
            orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking tracking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  }, req);
}
