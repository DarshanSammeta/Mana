import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { AuditService } from "@/services/server/audit.service";
import { z } from "zod";

const disputeSchema = z.object({
  reason: z.string().min(10),
  description: z.string().min(20),
  attachments: z.array(z.string()).optional(),
  type: z.enum(["QUALITY", "NO_SHOW", "BEHAVIOR", "PAYMENT", "OTHER"]),
});

import { BookingAuthService } from "@/lib/services/booking-auth.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // 1. Authorization Check
    const canAccess = await BookingAuthService.canAccess(bookingId, payload.userId, payload.role);
    if (!canAccess) return NextResponse.json({
        success: false,
        message: "You are not authorized to raise a dispute for this booking.",
        requestId: req.headers.get("x-request-id")
    }, { status: 403 });

    const body = await req.json();
    const validated = disputeSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
          customerprofile: {
              include: {
                  user: { select: { fullName: true, id: true } }
              }
          },
          vendorprofile: { select: { businessName: true, userId: true } }
      }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    const isCustomer = booking.customerprofile?.userId === payload.userId;
    const isVendor = booking.vendorprofile?.userId === payload.userId;

    if (!isCustomer && !isVendor && payload.role !== "ADMIN") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const dispute = await prisma.$transaction(async (tx) => {
        const result = await tx.dispute.create({
            data: {
                bookingId,
                raisedBy: payload.userId,
                reason: validated.reason,
                description: validated.description,
                status: "OPEN",
                evidence: validated.attachments ? { urls: validated.attachments } : {},
                updatedAt: new Date(),
            }
        });

        // Update booking status via State Machine
        const { TimelineService } = await import("@/services/server/timeline.service");
        await TimelineService.transitionStatus(
            bookingId,
            "DISPUTED",
            {
                id: payload.userId,
                name: isCustomer ? booking.customerprofile.user.fullName : (booking.vendorprofile as any).businessName,
                role: payload.role
            },
            `Dispute Raised: ${validated.reason}`,
            tx
        );

        return result;
    });

    await AuditService.log({
      entityType: "DISPUTE",
      entityId: dispute.id,
      bookingId,
      module: "BOOKING_OPERATIONS",
      action: "DISPUTE_RAISED",
      performedByUserId: payload.userId,
      performedByRole: payload.role,
      metadata: { bookingId },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    return NextResponse.json({
        success: true,
        message: "Dispute raised successfully",
        data: dispute,
        requestId: req.headers.get("x-request-id")
    }, { status: 201 });
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const disputes = await prisma.dispute.findMany({
      where: { bookingId },
    });

    return NextResponse.json(disputes);
  });
}
