import { prisma } from "./prisma";
import { inngest } from "./inngest";
import crypto from "crypto";
import { emitSocketEvent } from "./socket-helper";

import { SendNotificationParams } from "@/types";

/**
 * Enterprise Centralized Notification System
 * Handles database persistence and triggers background jobs for Email/SMS/Push
 */
export async function sendNotification({
  userId,
  title,
  message,
  category,
  priority = 'MEDIUM',
  link,
  metadata = {}
}: SendNotificationParams) {
  // 1. Create In-App Notification Record
  const notification = await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      title,
      message,
      category: category as any,
      priority: priority as any,
      link,
      metadata: metadata || {},
    }
  });

  // 2. Emit Real-time Socket Event
  emitSocketEvent(userId, "notification:new", notification);

  // 3. Fetch User Preferences
  const preference = await prisma.notification_preference.findUnique({
    where: { userId }
  });

  // 4. Dispatch Background Jobs via Inngest for External Channels
  const channels = {
    email: preference ? preference.email : true,
    sms: preference ? preference.sms : (priority === 'URGENT' || priority === 'HIGH'),
    push: preference ? preference.push : true
  };

  // Optimization: Do not await Inngest dispatch in the critical path
  inngest.send({
    name: "notification/dispatch.external",
    data: {
      notificationId: notification.id,
      userId,
      channels,
      payload: { title, message, category, metadata }
    }
  }).catch(err => {
    console.error("[Notification] Inngest dispatch failed:", err);
  });

  return notification;
}

/**
 * Enterprise Operational Notification Triggers
 */
export const NotificationTriggers = {
  vendorAccountStatus: async (
    userId: string,
    status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUIRED' | 'SUSPENDED' | 'PENDING',
    reason?: string
  ) => {
    let title = "Account Status Update";
    let message = "";
    let link = "/vendor/dashboard";

    switch (status) {
      case 'PENDING':
        title = "Profile Submitted";
        message = "Your business profile has been successfully submitted and is awaiting review.";
        break;
      case 'APPROVED':
        title = "Account Approved! 🚀";
        message = "Congratulations! Your vendor account has been verified. You can now start receiving bookings.";
        break;
      case 'REJECTED':
        title = "Verification Rejected";
        message = `Unfortunately, your verification was not successful.${reason ? ` Reason: ${reason}` : ""}`;
        break;
      case 'CHANGES_REQUIRED':
        title = "Changes Required";
        message = `Action Required: Please update your profile as per admin feedback.${reason ? ` Feedback: ${reason}` : ""}`;
        break;
      case 'SUSPENDED':
        title = "Account Suspended ⚠️";
        message = `Your account has been suspended.${reason ? ` Reason: ${reason}` : ""}`;
        link = "/vendor/suspended";
        break;
    }

    return await sendNotification({
      userId,
      title,
      message,
      category: "SYSTEM",
      priority: "HIGH",
      link,
      metadata: {
        templateId: "VENDOR_VERIFICATION",
        status: status === 'PENDING' ? 'UNDER_REVIEW' : status,
        reason
      }
    });
  },

  bookingCreated: async (booking: any) => {
    // To Vendor
    if (booking.vendorprofile) {
      await sendNotification({
        userId: booking.vendorprofile.userId,
        title: "New Booking Request 📥",
        message: `You have a new request #${booking.bookingNumber}. Please review and accept.`,
        category: 'BOOKING',
        priority: 'HIGH',
        link: `/vendor/bookings/${booking.id}`,
      });
    }
  },

  advancePaid: async (booking: any) => {
    // Resolve Customer User ID
    const customerUserId = booking.customerprofile?.userId;
    if (!customerUserId) return;

    // To Customer
    await sendNotification({
      userId: customerUserId,
      title: "Advance Payment Confirmed ✅",
      message: `Your 30% advance for #${booking.bookingNumber} is received. Vendor notified.`,
      category: 'PAYMENT',
      priority: 'HIGH',
    });
    // To Vendor
    if (booking.vendorprofile) {
        await sendNotification({
          userId: booking.vendorprofile.userId,
          title: "Payment Received 💰",
          message: `Advance payment for #${booking.bookingNumber} is confirmed. Please review now.`,
          category: 'PAYMENT',
          priority: 'HIGH',
          link: `/vendor/bookings/${booking.id}`,
        });
    }
  },

  paymentSuccess: async (booking: any, payment: any) => {
    // Resolve Customer User ID
    const customerUserId = booking.customerprofile?.userId;
    if (!customerUserId) return;

    // To Customer
    await sendNotification({
      userId: customerUserId,
      title: "Payment Successful",
      message: `Your payment of ₹${payment.amount} for booking #${booking.bookingNumber} was successful.`,
      category: 'PAYMENT',
      priority: 'HIGH',
      metadata: { bookingId: booking.id, paymentId: payment.id }
    });

    // To Vendor
    if (booking.vendorprofile) {
      await sendNotification({
          userId: booking.vendorprofile.userId,
          title: "Booking Confirmed",
          message: `Booking #${booking.bookingNumber} has been confirmed via successful payment.`,
          category: 'BOOKING',
          priority: 'HIGH',
          link: `/vendor/bookings/${booking.id}`,
          metadata: { bookingId: booking.id }
      });
    }
  },

  bookingStatusUpdated: async (booking: any, status: string) => {
    let title = "";
    let message = "";
    const targetUserId = booking.customerprofile?.userId;
    const link = `/customer/bookings/${booking.id}`;

    if (!targetUserId) return;

    switch (status) {
      case 'PENDING_VENDOR_RESPONSE':
        title = "Request Submitted 📤";
        message = "Your booking request has been sent to the vendor.";
        break;
      case 'COUNTERED':
        title = "Counter Quote Received 💰";
        message = `${booking.vendorprofile?.businessName} sent a counter-quote for #${booking.bookingNumber}.`;
        break;
      case 'ACCEPTED':
        title = "Request Accepted! 🎉";
        message = `${booking.vendorprofile?.businessName} has accepted your booking #${booking.bookingNumber}. Please pay the advance.`;
        break;
      case 'ADVANCE_PAYMENT_PENDING':
        title = "Advance Pending 💳";
        message = `Please pay the 30% advance for booking #${booking.bookingNumber} to confirm.`;
        break;
      case 'CONFIRMED':
        title = "Booking Confirmed! ✨";
        message = `Your booking #${booking.bookingNumber} is now officially confirmed.`;
        break;
      case 'CANCELLED':
        title = "Booking Cancelled ❌";
        message = `Booking #${booking.bookingNumber} has been cancelled.`;
        break;
      case 'REJECTED':
        title = "Vendor Rejected 😔";
        message = `Unfortunately, the vendor could not accept your booking #${booking.bookingNumber}.`;
        break;
      case 'PREPARATION_STARTED':
        title = "Preparation Started 📦";
        message = `The vendor has started preparation for your event #${booking.bookingNumber}.`;
        break;
      case 'VENDOR_ASSIGNED':
        title = "Team Assigned 👥";
        message = `Execution team has been assigned for your event #${booking.bookingNumber}.`;
        break;
      case 'VENDOR_EN_ROUTE':
        title = "Vendor En Route 🚗";
        message = `Your vendor team is on the way to the venue for #${booking.bookingNumber}.`;
        break;
      case 'EVENT_STARTED':
        title = "Event Started 🚀";
        message = `Your event #${booking.bookingNumber} has officially started.`;
        break;
      case 'EVENT_COMPLETED':
        title = "Event Completed ✨";
        message = `Hope you enjoyed! Final 70% payment is now pending for #${booking.bookingNumber}.`;
        break;
      case 'FULLY_PAID':
        title = "Fully Paid 🏁";
        message = `All dues settled for booking #${booking.bookingNumber}. Thank you!`;
        break;
      default:
        title = "Booking Update";
        message = `Status of #${booking.bookingNumber} changed to ${status}.`;
    }

    return await sendNotification({
      userId: targetUserId,
      title,
      message,
      category: 'BOOKING',
      priority: 'MEDIUM',
      link,
    });
  }
};

export const NotificationService = {
  send: sendNotification,
  triggers: NotificationTriggers,
};
