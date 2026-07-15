import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const disputeSchema = z.object({
  reason: z.string().min(10),
  description: z.string().min(20),
  attachments: z.array(z.string()).optional(),
  type: z.enum(["QUALITY", "NO_SHOW", "BEHAVIOR", "PAYMENT", "OTHER"]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const validated = disputeSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vendorprofile: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // Ensure user is either customer or vendor of this booking
    const isCustomer = booking.customerId === payload.userId;
    const isVendor = booking.vendorprofile?.userId === payload.userId;

    if (!isCustomer && !isVendor) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const dispute = await prisma.dispute.create({
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

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "DISPUTED" }
    });

    await createAuditLog({
      userId: payload.userId,
      action: "DISPUTE_RAISED",
      details: { disputeId: dispute.id, bookingId },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    // Notify admins and other party
    // (Socket.io notification implementation here)

    return NextResponse.json(dispute, { status: 201 });
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const disputes = await prisma.dispute.findMany({
      where: { bookingId },
    });

    return NextResponse.json(disputes);
  });
}
