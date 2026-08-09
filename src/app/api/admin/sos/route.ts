import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const alerts = await prisma.event_incident_report.findMany({
      where,
      orderBy: {
        reportedAt: "desc"
      },
      include: {
        workspace: {
          select: {
            id: true,
            // Assuming workspace ID maps to booking if it was created from emergency route
          }
        }
      }
    });

    // Try to enrich with booking info if workspaceId is actually a bookingId
    const enrichedAlerts = await Promise.all(alerts.map(async (alert) => {
      const booking = await prisma.booking.findUnique({
        where: { id: alert.workspaceId },
        select: {
          bookingNumber: true,
          eventName: true,
          vendorprofile: { select: { businessName: true } },
          customerprofile: { select: { user: { select: { fullName: true } } } }
        }
      });

      return {
        ...alert,
        booking
      };
    }));

    return NextResponse.json({ rows: enrichedAlerts });
  }, req);
}

export async function PATCH(req: Request) {
  // This would usually be in [id]/route.ts but some APIs use a single route
  // The Admin API used PATCH /api/admin/sos/${id}
  return NextResponse.json({ message: "Use [id] route" }, { status: 405 });
}
