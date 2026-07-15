import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("timeline.service can only be used on the server.");
}
import { socketHelper } from "@/lib/socket-helper";

export class TimelineService {
  static async getBookingTimeline(bookingId: string) {
    const prisma = getPrisma();
    const logs = await prisma.bookingstatuslog.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
    });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vendorprofile: true,
        eventcheckin: true,
      }
    });

    if (!booking) return [];

    // Map status logs to timeline events
    const timeline = logs.map(log => ({
      status: log.status,
      timestamp: log.createdAt,
      message: log.notes || this.getStatusMessage(log.status, booking.vendorprofile?.businessName || "Partner"),
      isCompleted: true
    }));

    return timeline;
  }

  private static getStatusMessage(status: string, vendorName: string): string {
    const messages: Record<string, string> = {
      PENDING: "Booking request sent to vendor.",
      ACCEPTED: `${vendorName} has accepted your booking.`,
      CONFIRMED: "Booking confirmed. Vendor is locked for your date!",
      VENDOR_ASSIGNED: "Vendor team has been assigned.",
      VENDOR_TRAVELING: `${vendorName} is on the way to your location.`,
      VENDOR_ARRIVED: `${vendorName} has arrived at the venue.`,
      OTP_VERIFICATION_PENDING: "Please share the OTP with the vendor to start the service.",
      EVENT_STARTED: "Service has started. Enjoy your event!",
      EVENT_COMPLETED: "Service completed successfully.",
    };
    return messages[status] || status;
  }

  static async updateStatus(bookingId: string, status: any, notes?: string) {
    const prisma = getPrisma();
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { status },
        include: { user: true }
      });

      const log = await tx.bookingstatuslog.create({
        data: {
          bookingId,
          status,
          notes
        }
      });

      // Notify via Socket
      socketHelper.emit(booking.customerId, "booking:status_updated", {
        bookingId,
        status,
        message: this.getStatusMessage(status, ""),
        timestamp: log.createdAt
      });

      return log;
    });
  }
}
