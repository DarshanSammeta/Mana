import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";
import { emitSocketEvent } from "@/lib/socket-helper";
import logger from "@/lib/logger";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { type, location, message } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { fullName: true, mobileNumber: true } },
        vendorprofile: { select: { businessName: true, userId: true, user: { select: { mobileNumber: true } } } }
      }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // Create Incident Report
    const incident = await prisma.event_incident_report.create({
      data: {
        id: crypto.randomUUID(),
        workspaceId: bookingId, // Reusing workspaceId for simplicity in the schema or linking via metadata
        title: `SOS: ${type} - ${booking.bookingNumber}`,
        description: `Emergency triggered by ${payload.role}. Location: ${JSON.stringify(location)}. Message: ${message}`,
        severity: "CRITICAL",
        status: "OPEN"
      }
    });

    // Alert Admin via Notifications
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        title: "🆘 EMERGENCY ALERT",
        message: `${payload.role} raised an SOS for Booking #${booking.bookingNumber}`,
        category: "SYSTEM",
        priority: "URGENT",
        link: `/admin/live-tracking?bookingId=${bookingId}`,
        metadata: { bookingId, incidentId: incident.id }
      });
    }

    // Emit Real-time Socket Event to Admin Dashboard
    emitSocketEvent("ADMIN_ROOM", "emergency:alert", {
      bookingId,
      bookingNumber: booking.bookingNumber,
      raisedBy: payload.role,
      location,
      timestamp: new Date()
    });

    // Share location with emergency contacts (Mocked integration)
    logger.info(`Emergency location shared for ${booking.bookingNumber}`, { location });

    return NextResponse.json({ success: true, incidentId: incident.id });
  } catch (error) {
    logger.error("Error triggering emergency SOS", { error, bookingId });
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
