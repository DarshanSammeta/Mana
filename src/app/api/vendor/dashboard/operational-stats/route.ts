import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ status: 403 });

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    const vendorId = vendorProfile.id;
    const now = new Date();

    const [
        todayEvents,
        pendingReview,
        prepPending,
        teamPending,
        balancePending,
        upcoming
    ] = await Promise.all([
        // Today's Events
        prisma.booking.count({
            where: {
                vendorId,
                eventDate: { gte: startOfDay(now), lte: endOfDay(now) },
                status: { notIn: ["CANCELLED", "REJECTED", "CLOSED"] }
            }
        }),
        // Pending Review
        prisma.booking.count({
            where: { vendorId, status: "VENDOR_REVIEW" }
        }),
        // Preparation Pending
        prisma.booking.count({
            where: { vendorId, status: "CONFIRMED" }
        }),
        // Team Assignment Pending
        prisma.booking.count({
            where: {
                vendorId,
                status: "PREPARATION_STARTED",
                booking_team_assignment: { none: {} }
            }
        }),
        // Balance Pending
        prisma.booking.count({
            where: { vendorId, status: "BALANCE_PENDING" }
        }),
        // Upcoming (Next 7 days excluding today)
        prisma.booking.count({
            where: {
                vendorId,
                eventDate: { gt: endOfDay(now) },
                status: { in: ["CONFIRMED", "PREPARATION_STARTED", "VENDOR_ASSIGNED"] }
            }
        })
    ]);

    return NextResponse.json({
        todayEvents,
        pendingReview,
        prepPending,
        teamPending,
        balancePending,
        upcoming
    });
  }, req);
}
