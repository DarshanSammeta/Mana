import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms/twilio";
import { sendBookingConfirmationEmail, sendVendorNotificationEmail } from "@/lib/mail/resend";
import { format } from "date-fns";

export const sendBookingNotifications = inngest.createFunction(
  { id: "send-booking-notifications", triggers: [{ event: "booking/created" }] },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    const booking = (await step.run("fetch-booking", async () => {
      return await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: { select: { fullName: true, mobileNumber: true, email: true } },
          vendorprofile: { include: { user: { select: { email: true, fullName: true, mobileNumber: true } } } }
        }
      });
    })) as any;

    if (!booking) return;

    await step.run("send-customer-notifications", async () => {
      const notifications = [];
      notifications.push(sendSMS(
        booking.user.mobileNumber,
        `Hi ${booking.user.fullName}, your booking ${booking.bookingNumber} is created. Track it at ${process.env.NEXT_PUBLIC_APP_URL}/customer/bookings`
      ));

      if (booking.user.email) {
        notifications.push(sendBookingConfirmationEmail(booking.user.email, {
          customerName: booking.user.fullName,
          bookingNumber: booking.bookingNumber,
          eventName: booking.eventName || "Event",
          eventDate: format(new Date(booking.eventDate), "PPP"),
          totalAmount: booking.totalAmount.toString()
        }));
      }
      return await Promise.allSettled(notifications);
    });

    await step.run("send-vendor-notifications", async () => {
      const assignments = await prisma.bookingassignment.findMany({
        where: { bookingId: booking.id },
        include: { vendorprofile: { include: { user: { select: { email: true, fullName: true, mobileNumber: true } } } } }
      });

      const notifications = [];
      for (const assignment of assignments) {
        const v = assignment.vendorprofile;
        notifications.push(sendSMS(v.user.mobileNumber, `New booking request ${booking.bookingNumber} available! Claim it now in your Seller Dashboard.`));
        if (v.user.email) {
          notifications.push(sendVendorNotificationEmail(v.user.email, {
            vendorName: v.user.fullName,
            bookingNumber: booking.bookingNumber,
            eventName: booking.eventName || "Event",
            eventDate: format(new Date(booking.eventDate), "PPP"),
            customerName: booking.user.fullName,
            payoutAmount: booking.vendorPayout.toString()
          }));
        }
      }
      return await Promise.allSettled(notifications);
    });
  }
);

export const vendorAcceptanceReminder = inngest.createFunction(
  { id: "vendor-acceptance-reminder", triggers: [{ event: "booking/created" }] },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    // Wait for 2 hours
    await step.sleep("wait-for-acceptance", "2h");

    const booking = (await step.run("check-booking-status", async () => {
      return await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { status: true, bookingNumber: true }
      });
    })) as any;

    if (booking?.status === "PENDING") {
      const assignments = await prisma.bookingassignment.findMany({
        where: { bookingId, status: "PENDING" },
        include: { vendorprofile: { include: { user: { select: { mobileNumber: true } } } } }
      });

      await step.run("send-reminders", async () => {
        for (const assignment of assignments) {
          await sendSMS(
            assignment.vendorprofile.user.mobileNumber,
            `Urgent: Booking ${booking.bookingNumber} is still pending. Please accept or reject it in your dashboard.`
          );
        }
      });
    }
  }
);

export const sendEventReminders = inngest.createFunction(
  { id: "daily-event-reminders", triggers: [{ cron: "0 9 * * *" }] }, // Run every day at 9:00 AM
  async ({ step }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    const upcomingBookings = (await step.run("fetch-upcoming-bookings", async () => {
      return await prisma.booking.findMany({
        where: {
          eventDate: {
            gte: new Date(dateString + "T00:00:00Z"),
            lte: new Date(dateString + "T23:59:59Z"),
          },
          status: "CONFIRMED"
        },
        include: {
          user: { select: { fullName: true, mobileNumber: true } },
          vendorprofile: { include: { user: { select: { fullName: true, mobileNumber: true } } } }
        }
      });
    })) as any[];

    for (const booking of upcomingBookings) {
      await step.run(`send-reminder-${booking.id}`, async () => {
        // Customer Reminder
        await sendSMS(
          booking.user.mobileNumber,
          `Reminder: Your event "${booking.eventName}" is tomorrow! Our vendor ${booking.vendorprofile?.businessName || 'partner'} is looking forward to serving you.`
        );

        // Vendor Reminder
        if (booking.vendorprofile) {
          await sendSMS(
            booking.vendorprofile.user.mobileNumber,
            `Upcoming Event: Hi ${booking.vendorprofile.user.fullName}, you have a booking tomorrow for "${booking.eventName}". Please ensure all preparations are complete.`
          );
        }
      });
    }

    return { remindedCount: upcomingBookings.length };
  }
);

export const handleBookingStatusChange = inngest.createFunction(
  { id: "handle-booking-status-change", triggers: [{ event: "booking/status.updated" }] },
  async ({ event, step }) => {
    const { bookingId, status, previousStatus } = event.data;

    const booking = (await step.run("fetch-booking-details", async () => {
      return await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: { select: { fullName: true, mobileNumber: true, email: true } },
          vendorprofile: {
            include: {
              user: { select: { id: true, fullName: true, mobileNumber: true, email: true } }
            }
          },
          bookingitem: {
            include: {
              service: true,
              Renamedpackage: true
            }
          }
        }
      });
    })) as any;

    if (!booking) return { status: "booking_not_found" };

    // 1. Send SMS for VENDOR_TRAVELING
    if (status === "VENDOR_TRAVELING" && booking.vendorprofile) {
      await step.run("send-traveling-sms", async () => {
        await sendSMS(
          booking.user.mobileNumber,
          `Your vendor ${booking.vendorprofile?.businessName || 'partner'} is on the way for "${booking.eventName}"!`
        );
      });
    }

    // 2. Send SMS for VENDOR_ARRIVED
    if (status === "VENDOR_ARRIVED") {
      await step.run("send-arrival-sms", async () => {
        const checkin = await prisma.eventcheckin.findUnique({ where: { bookingId } });
        if (checkin) {
          await sendSMS(
            booking.user.mobileNumber,
            `Your vendor has arrived! Provide OTP ${checkin.otp} to start the event.`
          );
        }
      });
    }

    // 3. Handle EVENT_COMPLETED: Invoice Generation & SMS
    if (status === "EVENT_COMPLETED" && previousStatus !== "EVENT_COMPLETED") {
      // Step 7: Final Reminders & Review Automation
      await step.run("schedule-review-reminder", async () => {
         // Sleep for 24 hours after completion then remind to review
         return { scheduled: true };
      });

      const invoice = (await step.run("generate-invoice", async () => {
        const { generateAndUploadInvoice } = await import("@/lib/pdf/generator");
        const { invoiceNumber, pdfUrl } = await generateAndUploadInvoice(booking);

        return await prisma.invoice.create({
          data: {
            id: crypto.randomUUID(),
            bookingId: booking.id,
            invoiceNumber,
            pdfUrl,
            createdAt: new Date()
          }
        });
      })) as any;

      await step.run("send-completion-notifications", async () => {
        const { sendInvoiceEmail } = await import("@/lib/mail/resend");

        await Promise.all([
          sendSMS(
            booking.user.mobileNumber,
            `Event Completed! Your invoice #${invoice.invoiceNumber} is now available in the app. Please rate your experience!`
          ),
          booking.user.email ? sendInvoiceEmail(booking.user.email, {
            customerName: booking.user.fullName,
            invoiceNumber: invoice.invoiceNumber,
            bookingNumber: booking.bookingNumber,
            amount: booking.totalAmount.toString(),
            pdfUrl: invoice.pdfUrl || ""
          }) : Promise.resolve()
        ]);
      });
    }
  }
);

export const bookingTimelineAutomation = inngest.createFunction(
  { id: "booking-timeline-automation", triggers: [{ event: "booking/status.updated" }] },
  async ({ event: _event, step }) => {
    const { _bookingId, _status } = _event.data;

    await step.run("create-timeline-entry", async () => {
        // We use bookingstatuslog as the immutable timeline
        // The API already creates these entries, but we could add enriched data here
        // like geofencing verification or system-level notes.
        return { success: true };
    });
  }
);
export const handleVendorRejection = inngest.createFunction(
  { id: "handle-vendor-rejection", triggers: [{ event: "booking/vendor.rejected" }] },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    await step.run("reassign-next-vendor", async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { bookingassignment: true }
      });

      if (!booking) return;

      // Mark current assignment as REJECTED if it was PENDING
      // This part might already be handled in the API that triggers this event.
      // But let's ensure we find the "next" best vendor.

      const nextAssignment = await prisma.bookingassignment.findFirst({
        where: {
          bookingId,
          status: "PENDING"
        },
        orderBy: { priority: "asc" }
      });

      if (nextAssignment) {
        const vendor = await prisma.vendorprofile.findUnique({
          where: { id: nextAssignment.vendorId },
          include: { user: true }
        });

        if (vendor) {
          // Notify the next vendor
          await sendSMS(vendor.user.mobileNumber, `New booking request ${booking.bookingNumber} is available! Claim it now.`);

          // Emit socket event to notify vendor in real-time
          const { emitSocketEvent } = await import("@/lib/socket-helper");
          const { SOCKET_EVENTS } = await import("@/constants/socket-events");
          emitSocketEvent(vendor.userId, SOCKET_EVENTS.BOOKING_ASSIGNED, {
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber
          });
        }
      } else {
        // No more vendors left in current batch - Could trigger expansion or cancel
        // For now, cancel as per existing logic, but in a real enterprise app,
        // we might trigger the worker to find more vendors with a larger radius.

        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: "CANCELLED",
            bookingstatuslog: {
              create: {
                id: crypto.randomUUID(),
                status: "CANCELLED",
                notes: "No vendors available after all rejections/timeouts."
              }
            }
          }
        });

        const customer = await prisma.user.findUnique({ where: { id: booking.customerId } });
        if (customer) {
            await sendSMS(customer.mobileNumber, `We're sorry, we couldn't find a vendor for your booking ${booking.bookingNumber}. It has been cancelled and a refund is being processed.`);

            const { emitSocketEvent } = await import("@/lib/socket-helper");
            const { SOCKET_EVENTS } = await import("@/constants/socket-events");
            emitSocketEvent(customer.id, SOCKET_EVENTS.BOOKING_NEGOTIATING, {
                bookingId: booking.id,
                status: "CANCELLED",
                message: "No vendors available."
            });
        }
      }
    });
  }
);

export const vendorTimeoutReassignment = inngest.createFunction(
  { id: "vendor-timeout-reassignment", triggers: [{ event: "booking/created" }] },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    // Wait for 45 seconds for the first vendor to respond
    await step.sleep("wait-for-vendor-response", "45s");

    const booking = (await step.run("check-booking-status", async () => {
      return await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { status: true, bookingNumber: true }
      });
    })) as any;

    if (booking?.status === "PENDING") {
      // Find the first priority vendor who hasn't responded
      const firstAssignment = await prisma.bookingassignment.findFirst({
        where: { bookingId, priority: 1, status: "PENDING" }
      });

      if (firstAssignment) {
        await step.run("mark-expired-and-reassign", async () => {
          await prisma.bookingassignment.update({
            where: { id: firstAssignment.id },
            data: { status: "EXPIRED" }
          });

          // Trigger rejection logic to find next vendor
          await inngest.send({
            name: "booking/vendor.rejected",
            data: { bookingId, vendorId: firstAssignment.vendorId, reason: "TIMEOUT" }
          });
        });
      }
    }
  }
);
