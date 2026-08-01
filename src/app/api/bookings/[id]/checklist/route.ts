import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { ChecklistService } from "@/services/server/checklist.service";

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

    const checklist = await prisma.booking_checklist.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" }
    });

    const progress = await ChecklistService.getProgress(bookingId);

    return NextResponse.json({ checklist, progress });
  }, req);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ status: 403 });

    // 1. Authorization Check (Only Vendor or Admin can update checklist)
    const isVendor = await BookingAuthService.isAssignedVendor(bookingId, payload.userId);
    if (!isVendor && payload.role !== "ADMIN") {
        return NextResponse.json({ message: "Only the assigned vendor can update checklist items." }, { status: 403 });
    }

    const { itemId, isCompleted } = await req.json();

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { fullName: true }
    });

    const item = await ChecklistService.toggleItem(
        bookingId,
        itemId,
        isCompleted,
        payload.userId,
        user?.fullName || "Staff"
    );

    return NextResponse.json(item);
  }, req);
}
