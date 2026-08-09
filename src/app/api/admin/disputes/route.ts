import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    const where: any = {};
    if (status !== "all") {
        where.status = status.toUpperCase();
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
          booking: {
              select: { bookingNumber: true, totalAmount: true }
          }
      },
      orderBy: { createdAt: "desc" }
    });

    const rows = disputes.map(d => ({
        id: d.id,
        booking_id: d.bookingId,
        booking_number: d.booking.bookingNumber,
        reason: d.reason,
        opened_by_role: d.raisedBy,
        amount: Number(d.booking.totalAmount),
        status: d.status.toLowerCase(),
        created_at: d.createdAt
    }));

    return NextResponse.json({ rows, total: rows.length });
  }, req);
}
