import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || searchParams.get("pageSize") || "20");
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const skip = (page - 1) * limit;

    const where: any = {};

    // Status Mapping
    if (status !== "all") {
        if (status === "upcoming") {
            where.status = { in: ["PENDING", "ACCEPTED", "CONFIRMED"] };
        } else if (status === "live") {
            where.status = { in: ["VENDOR_TRAVELING", "VENDOR_ARRIVED", "IN_PROGRESS", "EVENT_ONGOING"] };
        } else if (status === "completed") {
            where.status = { in: ["EVENT_COMPLETED", "CLOSED", "CUSTOMER_CONFIRMED", "PAYMENT_RELEASED"] };
        } else if (status === "cancelled") {
            where.status = "CANCELLED";
        }
    }

    // Search Mapping
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { eventName: { contains: search, mode: 'insensitive' } },
        { customerprofile: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
        { vendorprofile: { businessName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          customerprofile: {
            include: { user: { select: { fullName: true, email: true } } }
          },
          vendorprofile: {
            select: { businessName: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.booking.count({ where })
    ]);

    // Format for Admin BFF expectation (Hardened with Null Checks)
    const rows = bookings.map(b => ({
        id: b.id,
        booking_number: b.bookingNumber || "—",
        customer: b.customerprofile?.user?.fullName || "UNKNOWN",
        vendor: b.vendorprofile?.businessName || "—",
        service: b.eventType || "Service",
        amount: Number(b.totalAmount || 0),
        status: (b.status || "PENDING").toLowerCase(),
        event_date: b.eventDate,
        created_at: b.createdAt
    }));

    return NextResponse.json({
      rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  }, req);
}
