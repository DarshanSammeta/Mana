import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/notifications";

export const paymentReminder = inngest.createFunction(
  { id: "payment-reminder", triggers: [{ cron: "0 10 * * *" }] },
  async ({ step }) => {
    const pendingBookings = (await step.run("fetch-pending-payments", async () => {
      return prisma.booking.findMany({
        where: {
          status: "PENDING",
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // More than 24h old
          },
        },
        include: { user: true },
      });
    })) as any[];

    for (const booking of pendingBookings) {
      await step.run(`send-reminder-${booking.id}`, async () => {
        await NotificationService.send({
          userId: booking.customerId,
          title: "Complete Your Booking",
          message: `Your booking #${booking.bookingNumber} is pending payment. Complete it now to secure your date!`,
          category: "PAYMENT",
          priority: "HIGH",
        });
      });
    }
  }
);

export const preEventTimelineReminders = inngest.createFunction(
  { id: "pre-event-reminders", triggers: [{ cron: "0 9 * * *" }] },
  async ({ step }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Five-Day Confirmation Reminder
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5);

    const fiveDayBookings = (await step.run("fetch-5d-bookings", async () => {
      return prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          eventDate: {
            gte: new Date(fiveDaysFromNow.setHours(0, 0, 0, 0)),
            lt: new Date(fiveDaysFromNow.setHours(23, 59, 59, 999)),
          },
          vendorConfirmedAt5d: { not: true }
        },
        include: { user: true, vendorprofile: true }
      });
    })) as any[];

    for (const booking of fiveDayBookings) {
      if (!booking.vendorprofile) continue;
      await step.run(`send-5d-reminder-${booking.id}`, async () => {
        await NotificationService.send({
          userId: booking.vendorprofile!.userId,
          title: "Action Required: 5-Day Event Confirmation",
          message: `Your event #${booking.bookingNumber} for ${booking.eventName} is in 5 days. Please confirm your availability and readiness.`,
          category: "BOOKING",
          priority: "HIGH",
        });
      });
    }

    // 2. Three-Day Checklist Reminder
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const threeDayBookings = (await step.run("fetch-3d-bookings", async () => {
      return prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          eventDate: {
            gte: new Date(threeDaysFromNow.setHours(0, 0, 0, 0)),
            lt: new Date(threeDaysFromNow.setHours(23, 59, 59, 999)),
          }
        },
        include: { user: true, vendorprofile: true }
      });
    })) as any[];

    for (const booking of threeDayBookings) {
      if (!booking.vendorprofile) continue;
      await step.run(`send-3d-checklist-${booking.id}`, async () => {
        await NotificationService.send({
          userId: booking.vendorprofile!.userId,
          title: "3-Day Checklist: Prepare for Event",
          message: `Your event #${booking.bookingNumber} is in 3 days. Please review your checklist and ensure all materials are ready.`,
          category: "BOOKING",
          priority: "MEDIUM",
        });
      });
    }

    // 3. One-Day Final Reminder (Handled by eventReminder, but we can consolidate or keep it separate)
    // Consolidating for clarity in the timeline
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const oneDayBookings = (await step.run("fetch-1d-bookings", async () => {
      return prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          eventDate: {
            gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
            lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
          }
        },
        include: { user: true, vendorprofile: true }
      });
    })) as any[];

    for (const booking of oneDayBookings) {
      await step.run(`send-1d-final-${booking.id}`, async () => {
        // To Customer
        await NotificationService.send({
          userId: booking.customerId,
          title: "Get Ready! Your Event is Tomorrow",
          message: `Your event "${booking.eventName}" with ${booking.vendorprofile?.businessName || 'your partner'} is scheduled for tomorrow at ${booking.eventTime}.`,
          category: "BOOKING",
          priority: "URGENT",
        });

        // To Vendor
        if (booking.vendorprofile) {
          await NotificationService.send({
            userId: booking.vendorprofile.userId,
            title: "Final Reminder: Event Tomorrow",
            message: `You have an event #${booking.bookingNumber} tomorrow for "${booking.eventName}". Please arrive 30 minutes early.`,
            category: "BOOKING",
            priority: "URGENT",
          });
        }
      });
    }

    return {
      fiveDay: fiveDayBookings.length,
      threeDay: threeDayBookings.length,
      oneDay: oneDayBookings.length
    };
  }
);

export const eventReminder = inngest.createFunction(
  { id: "event-reminder", triggers: [{ cron: "0 9 * * *" }] },
  async ({ step }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingEvents = (await step.run("fetch-tomorrow-events", async () => {
      return prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          eventDate: {
            gte: new Date(tomorrow.setHours(0,0,0,0)),
            lt: new Date(tomorrow.setHours(23,59,59,999)),
          }
        },
        include: { user: true, vendorprofile: true }
      });
    })) as any[];

    for (const event of upcomingEvents) {
      await step.run(`notify-event-${event.id}`, async () => {
        await NotificationService.send({
          userId: event.customerId,
          title: "Upcoming Event Tomorrow!",
          message: `Get ready! Your event with ${event.vendorprofile?.businessName || 'your partner'} is scheduled for tomorrow at ${event.eventTime}.`,
          category: "BOOKING",
          priority: "URGENT",
        });
      });
    }
  }
);

export const reviewReminder = inngest.createFunction(
  { id: "review-reminder", triggers: [{ event: "booking/status.updated" }] },
  async ({ event, step }) => {
    if (event.data.status !== "EVENT_COMPLETED") return;

    // Wait 24 hours before asking for a review
    await step.sleep("wait-for-feedback", "24h");

    const booking = (await step.run("get-booking", async () => {
      return prisma.booking.findUnique({
        where: { id: event.data.bookingId },
        include: { vendorprofile: true }
      });
    })) as any;

    if (booking) {
      await NotificationService.send({
        userId: booking.customerId,
        title: "How was your experience?",
        message: `Your event with ${booking.vendorprofile?.businessName || 'your partner'} is complete. Share your feedback and earn loyalty points!`,
        category: "REVIEW",
      });
    }
  }
);
