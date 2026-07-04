import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { sendBookingNotifications, vendorAcceptanceReminder, sendEventReminders } from "@/inngest/booking-functions";
import { reconcilePayments, releaseEscrowAfterEvent } from "@/inngest/payment-functions";
import { dispatchExternalNotification } from "@/inngest/notification-functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendBookingNotifications,
    vendorAcceptanceReminder,
    sendEventReminders,
    reconcilePayments,
    releaseEscrowAfterEvent,
    dispatchExternalNotification
  ],
});
