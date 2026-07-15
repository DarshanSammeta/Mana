import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import {
  sendBookingNotifications,
  vendorAcceptanceReminder,
  sendEventReminders,
  handleBookingStatusChange,
  bookingTimelineAutomation,
  handleVendorRejection
} from "@/inngest/booking-functions";
import { reconcilePayments, releaseEscrowAfterEvent } from "@/inngest/payment-functions";
import { dispatchExternalNotification } from "@/inngest/notification-functions";
import { paymentReminder, eventReminder, reviewReminder } from "@/inngest/reminders";
import { checkSavedSearches } from "@/inngest/search-alerts";
import { onPointsEarned, onReferralSignup } from "@/inngest/loyalty";
import {
  checkSupportSLA,
  updateQualityMetricsJob,
  autoCancellationJob,
  documentExpiryCheck
} from "@/inngest/operations";
import { dailyVendorSettlement, aggregateFinanceBI, processRefundJob } from "@/inngest/finance";
import { processScheduledCampaign, aggregateMarketingAnalytics, updateCRMDataJob } from "@/inngest/marketing";
import { monitorSystemHealth } from "@/inngest/monitoring";
import { sendDailyPlanningSummary, sendRSVPReminders, budgetThresholdAlert } from "@/inngest/event-planning";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendBookingNotifications,
    vendorAcceptanceReminder,
    sendEventReminders,
    handleBookingStatusChange,
    bookingTimelineAutomation,
    handleVendorRejection,
    reconcilePayments,
    releaseEscrowAfterEvent,
    dispatchExternalNotification,
    paymentReminder,
    eventReminder,
    reviewReminder,
    checkSavedSearches,
    onPointsEarned,
    onReferralSignup,
    checkSupportSLA,
    updateQualityMetricsJob,
    autoCancellationJob,
    documentExpiryCheck,
    dailyVendorSettlement,
    aggregateFinanceBI,
    processRefundJob,
    processScheduledCampaign,
    aggregateMarketingAnalytics,
    updateCRMDataJob,
    monitorSystemHealth,
    sendDailyPlanningSummary,
    sendRSVPReminders,
    budgetThresholdAlert
  ],
});
