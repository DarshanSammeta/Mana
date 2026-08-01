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
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // 1. Authorization Check
    const canAccess = await BookingAuthService.canAccess(bookingId, payload.userId, payload.role);
    if (!canAccess) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const staff = await prisma.staff.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(staff);
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // 1. Authorization Check (Only Vendor or Admin)
    const isVendor = await BookingAuthService.isAssignedVendor(bookingId, payload.userId);
    if (!isVendor && payload.role !== "ADMIN") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { name, role, phone } = await req.json();

    if (!name || !role) {
      return NextResponse.json({ message: "Name and role are required" }, { status: 400 });
    }

    const staff = await prisma.staff.create({
      data: {
        id: crypto.randomUUID(),
        bookingId,
        name,
        role,
        phone,
        status: "ASSIGNED",
      },
    });

    return NextResponse.json(staff);
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // 1. Authorization Check (Only Vendor or Admin)
    const isVendor = await BookingAuthService.isAssignedVendor(bookingId, payload.userId);
    if (!isVendor && payload.role !== "ADMIN") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");

    if (!staffId) return NextResponse.json({ message: "Staff ID required" }, { status: 400 });

    await prisma.staff.delete({
      where: { id: staffId },
    });
    return NextResponse.json({ message: "Staff removed" });
  });
}
