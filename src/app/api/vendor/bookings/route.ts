import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = { vendorprofile: { userId: payload.userId } };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          totalAmount: true,
          advanceAmount: true,
          balanceAmount: true,
          paymentStage: true,
          advancePaidAt: true,
          balancePaidAt: true,
          eventDate: true,
          eventTime: true,
          eventLocation: true,
          createdAt: true,
          customerprofile: {
            select: {
              user: { select: { fullName: true, mobileNumber: true, email: true } }
            }
          },
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
      }),
      prisma.booking.count({ where })
    ]);

    return NextResponse.json({
        bookings: bookings,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });
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

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    try {
      const { bookingId, status, notes } = await req.json();

      const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: {
            status: true,
            advanceAmount: true,
            advancePaidAt: true,
            paymentStage: true,
            vendorprofile: {
              select: { userId: true, businessName: true }
            }
          }
      });

      if (!booking || booking.vendorprofile?.userId !== payload.userId) {
          return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }

      // Guard: Cannot complete if advance not paid
      if (status === "EVENT_COMPLETED" && booking.paymentStage !== "ADVANCE_PAID" && booking.paymentStage !== "FULLY_PAID") {
          return NextResponse.json({ message: "Cannot complete event until advance payment is received." }, { status: 400 });
      }

      // 3. Transition via State Machine (Handles timeline, audit, and validation)
      const { TimelineService } = await import("@/services/server/timeline.service");
      const updatedBooking = await TimelineService.transitionStatus(
          bookingId,
          status,
          { id: payload.userId, name: booking.vendorprofile?.businessName || "Vendor", role: payload.role },
          notes
      );

      return NextResponse.json(updatedBooking);
    } catch (error) {
      logger.error("Vendor Bookings PATCH Error", { error });
      return NextResponse.json(
        { message: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 400 }
      );
    }
  }
