import "server-only";
import { getPrisma } from "@/lib/prisma";
import { booking_status } from "@prisma/client";
import { isValidTransition } from "@/lib/booking-state-machine";
import { emitSocketEvent } from "@/lib/socket-helper";

if (typeof window !== "undefined") {
  throw new Error("TimelineService can only be used on the server.");
}

export class TimelineService {
  /**
   * Fetches the complete operational timeline for a booking.
   */
  static async getBookingTimeline(bookingId: string) {
    const prisma = getPrisma();
    return await prisma.booking_timeline.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Enforces the state machine and performs a status transition.
   * Automatically creates status logs, timeline entries, and audit logs.
   */
  static async transitionStatus(
    bookingId: string,
    nextStatus: booking_status,
    performer: { id: string; name: string; role: string },
    reason?: string,
    txClient?: any
  ) {
    const prisma = txClient || getPrisma();

    // 1. Fetch current state
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vendorprofile: { select: { userId: true, businessName: true } },
        customerprofile: { select: { userId: true } }
      }
    });

    if (!booking) throw new Error("Booking not found");

    // 2. Validate transition
    if (!isValidTransition(booking.status, nextStatus)) {
      throw new Error(`Invalid status transition from ${booking.status} to ${nextStatus}`);
    }

    // 3. Execute transition
    const executeTransition = async (db: any) => {
      const updated = await db.booking.update({
        where: { id: bookingId },
        data: { status: nextStatus },
      });

      // Standard Status Log (Legacy compatibility)
      await db.bookingstatuslog.create({
        data: {
          id: crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}`,
          bookingId,
          status: nextStatus,
          notes: reason
        }
      });

      // Enterprise Timeline Entry
      const meta = this.getTimelineMetadata(nextStatus);
      await db.booking_timeline.create({
        data: {
          bookingId,
          title: meta.title,
          description: reason || meta.description.replace("{vendor}", booking.vendorprofile?.businessName || "Vendor"),
          performedBy: performer.name,
          role: performer.role,
          icon: meta.icon,
          color: meta.color,
          metadata: { performerId: performer.id, previousStatus: booking.status }
        }
      });

      // Granular Audit Log
      const { AuditService } = await import("./audit.service");
      // Note: AuditService doesn't support tx client yet, but audit logs are usually fine as separate transactions
      await AuditService.logBooking(
        bookingId,
        "STATUS_TRANSITION",
        performer,
        { old: { status: booking.status }, new: { status: nextStatus } }
      );

      // Real-time Update via Socket
      emitSocketEvent(booking.customerprofile.userId, `booking_${nextStatus.toLowerCase()}`, {
          bookingId,
          status: nextStatus,
          title: meta.title
      });

      if (booking.vendorprofile) {
          emitSocketEvent(booking.vendorprofile.userId, `booking_${nextStatus.toLowerCase()}`, {
              bookingId,
              status: nextStatus,
              title: meta.title
          });
      }

      // --- Enterprise Operational Side Effects (Backgrounded for Performance) ---
      const { inngest } = await import("@/lib/inngest");

      try {
          // 1. Calendar Integration: Block slot on CONFIRMED
          if (nextStatus === "CONFIRMED" && booking.vendorId) {
              await db.availability.create({
                  data: {
                      id: crypto.randomUUID ? crypto.randomUUID() : `avail_${Date.now()}`,
                      vendorProfileId: booking.vendorId,
                      date: booking.eventDate,
                      isAvailable: false,
                      notes: `Booking confirmed: ${booking.bookingNumber}`,
                      startTime: booking.eventTime || "12:00",
                      bookingLimit: 1
                  }
              });
          }

          // 2. Release slot on CANCELLED/REJECTED
          if ((nextStatus === "CANCELLED" || nextStatus === "REJECTED") && booking.vendorId) {
               await db.availability.deleteMany({
                   where: {
                       vendorProfileId: booking.vendorId,
                       date: booking.eventDate,
                       notes: { contains: booking.bookingNumber }
                   }
               });
          }
          // Offload heavy work to background workers
          await inngest.send({
              name: "booking/status.updated",
              data: {
                  bookingId,
                  status: nextStatus,
                  previousStatus: booking.status,
                  performer
              }
          });

          // Special case: Document generation triggers
          if (["ADVANCE_PAID", "CONFIRMED", "FULLY_PAID"].includes(nextStatus)) {
              await inngest.send({
                  name: "booking/document.generate",
                  data: {
                      bookingId,
                      type: nextStatus === "ADVANCE_PAID" ? "RECEIPT" : (nextStatus === "CONFIRMED" ? "AGREEMENT" : "INVOICE")
                  }
              });
          }

          // Special case: Automated Refunds
          if ((nextStatus === "REJECTED" || nextStatus === "CANCELLED") && updated.advancePaidAt) {
              await inngest.send({
                  name: "booking/refund.initiate",
                  data: {
                      bookingId,
                      reason: `Automated refund due to status change: ${nextStatus}`,
                      isSystemAction: true
                  }
              });
          }
      } catch (sideEffectError) {
          console.error("Failed to queue background side effects:", sideEffectError);
          // We don't fail the transaction if queuing fails, but we log it.
          // In a real enterprise app, we'd have a fallback mechanism.
      }

      return updated;
    };

    if (txClient) {
        return await executeTransition(txClient);
    } else {
        return await getPrisma().$transaction(async (tx) => {
            return await executeTransition(tx);
        });
    }
  }

  /**
   * Static helper for mapping statuses to rich UI metadata.
   */
  private static getTimelineMetadata(status: booking_status) {
    const metadata: Record<string, { title: string; description: string; icon: string; color: string }> = {
      PENDING_VENDOR_RESPONSE: {
        title: "Request Submitted",
        description: "Your booking request has been sent to {vendor}. Waiting for response.",
        icon: "Send",
        color: "blue"
      },
      COUNTERED: {
        title: "Counter Quote Received",
        description: "{vendor} has sent a counter-quote for your request. Please review.",
        icon: "RefreshCw",
        color: "amber"
      },
      ACCEPTED: {
        title: "Request Accepted",
        description: "{vendor} has accepted your request. Ready for advance payment.",
        icon: "CheckCircle2",
        color: "emerald"
      },
      ADVANCE_PAYMENT_PENDING: {
        title: "Advance Payment Pending",
        description: "Please pay the 30% advance to confirm your booking.",
        icon: "CreditCard",
        color: "blue"
      },
      CONFIRMED: {
        title: "Booking Confirmed",
        description: "Great news! Your booking with {vendor} is now officially confirmed.",
        icon: "Sparkles",
        color: "purple"
      },
      EXPIRED: {
        title: "Request Expired",
        description: "The vendor did not respond within the 24-hour SLA.",
        icon: "Clock",
        color: "slate"
      },
      PAYMENT_EXPIRED: {
        title: "Payment Expired",
        description: "The advance payment was not received within the required timeframe.",
        icon: "Clock",
        color: "slate"
      },
      COUNTER_REJECTED: {
        title: "Counter Rejected",
        description: "The counter-quote was rejected.",
        icon: "XCircle",
        color: "rose"
      },
      PREPARATION_STARTED: {
        title: "Preparation Started",
        description: "Vendor has started the preparation phase for your event.",
        icon: "Package",
        color: "indigo"
      },
      VENDOR_ASSIGNED: {
        title: "Team Assigned",
        description: "The execution team has been assigned to your event.",
        icon: "Users",
        color: "blue"
      },
      VENDOR_EN_ROUTE: {
        title: "Vendor En Route",
        description: "The vendor team is currently traveling to the venue.",
        icon: "Truck",
        color: "orange"
      },
      EVENT_STARTED: {
        title: "Event Started",
        description: "Your event has officially commenced. Enjoy!",
        icon: "Play",
        color: "rose"
      },
      EVENT_COMPLETED: {
        title: "Event Completed",
        description: "Service was successfully delivered. Hope you had a great time!",
        icon: "Flag",
        color: "emerald"
      },
      BALANCE_PENDING: {
        title: "Balance Payment Due",
        description: "The final 70% payment is now due for processing.",
        icon: "Info",
        color: "blue"
      },
      FULLY_PAID: {
        title: "Fully Paid",
        description: "All payments for this booking have been settled.",
        icon: "ShieldCheck",
        color: "emerald"
      },
      CLOSED: {
        title: "Booking Closed",
        description: "This booking has been successfully completed and closed.",
        icon: "Lock",
        color: "slate"
      },
      CANCELLED: {
        title: "Booking Cancelled",
        description: "This booking was cancelled.",
        icon: "XCircle",
        color: "rose"
      },
      REJECTED: {
        title: "Vendor Rejected",
        description: "The vendor was unable to accept this booking request.",
        icon: "XCircle",
        color: "rose"
      }
    };

    return metadata[status] || {
      title: "Status Update",
      description: `Booking status changed to ${status}`,
      icon: "Info",
      color: "slate"
    };
  }

  /**
   * Helper to manually add a custom timeline record.
   */
  static async addTimelineEntry(bookingId: string, data: { title: string; description: string; performedBy: string; role: string; icon?: string; color?: string }) {
      const prisma = getPrisma();
      return await prisma.booking_timeline.create({
          data: {
              bookingId,
              ...data
          }
      });
  }
}
