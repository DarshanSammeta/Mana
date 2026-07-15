import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendVendorNotificationEmail } from "@/lib/mail/resend";
import { sendSMS } from "@/lib/sms/twilio";
import logger from "@/lib/logger";

/**
 * Inngest function to handle external notification delivery (Email, SMS, Push)
 */
export const dispatchExternalNotification = inngest.createFunction(
  { id: "dispatch-external-notification", name: "Dispatch External Notification", triggers: [{ event: "notification/dispatch.external" }] },
  async ({ event, step }) => {
    const { notificationId, userId, channels, payload } = event.data;

    const user = await step.run("fetch-user-contact", async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, mobileNumber: true, fullName: true }
      });
    }) as any;

    if (!user) return { status: "user_not_found" };

    const results = {
      email: false,
      sms: false,
      push: false
    };

    // 1. Send Email via Resend
    if (channels.email && user.email) {
      const emailResult = await step.run("send-email", async () => {
        try {
          // You can expand this to use templates based on category/metadata
          await sendVendorNotificationEmail(user.email!, {
            vendorName: user.fullName || "User",
            bookingNumber: payload.metadata?.bookingNumber || "N/A",
            eventName: payload.metadata?.eventName || "Event",
            eventDate: payload.metadata?.eventDate || "N/A",
            customerName: payload.metadata?.customerName || "Customer",
            payoutAmount: payload.metadata?.amount || "0",
          });
          return true;
        } catch (e) {
          logger.error("Email delivery failed in Inngest", e);
          return false;
        }
      });
      results.email = !!emailResult;
    }

    // 2. Send SMS via Twilio
    if (channels.sms && user.mobileNumber) {
      const smsResult = await step.run("send-sms", async () => {
        try {
          const res = await sendSMS(user.mobileNumber!, `${payload.title}: ${payload.message}`);
          return !!res;
        } catch (e) {
          logger.error("SMS delivery failed in Inngest", e);
          return false;
        }
      });
      results.sms = !!smsResult;
    }

    // 3. Update Notification Record with delivery status
    await step.run("update-notification-status", async () => {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          emailSent: results.email,
          smsSent: results.sms,
          pushSent: results.push, // Placeholder for actual push logic
        }
      });
    });

    return { status: "completed", results };
  }
);
