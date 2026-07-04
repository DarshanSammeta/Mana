import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms/twilio";
import { sendBookingConfirmationEmail, sendVendorNotificationEmail } from "@/lib/mail/resend";
import { format } from "date-fns";

export const sendBookingNotifications = inngest.createFunction(
  { id: "send-booking-notifications", triggers: [{ event: "booking/created" }] },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    const booking = await step.run("fetch-booking", async () => {
      return await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: { select: { fullName: true, mobileNumber: true, email: true } },
          vendorprofile: { include: { user: { select: { email: true, fullName: true, mobileNumber: true } } } }
        }
      });
    });

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

    const booking = await step.run("check-booking-status", async () => {
      return await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { status: true, bookingNumber: true }
      });
    });

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

    const upcomingBookings = await step.run("fetch-upcoming-bookings", async () => {
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
    });

    for (const booking of upcomingBookings) {
      await step.run(`send-reminder-${booking.id}`, async () => {
        // Customer Reminder
        await sendSMS(
          booking.user.mobileNumber,
          `Reminder: Your event "${booking.eventName}" is tomorrow! Our vendor ${booking.vendorprofile.businessName} is looking forward to serving you.`
        );

        // Vendor Reminder
        await sendSMS(
          booking.vendorprofile.user.mobileNumber,
          `Upcoming Event: Hi ${booking.vendorprofile.user.fullName}, you have a booking tomorrow for "${booking.eventName}". Please ensure all preparations are complete.`
        );
      });
    }

    return { remindedCount: upcomingBookings.length };
  }
);
