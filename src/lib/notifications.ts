import { prisma } from "./prisma";
import { inngest } from "./inngest";
import crypto from "crypto";
import { emitSocketEvent } from "./socket-helper";
import { SOCKET_EVENTS } from "@/constants/socket-events";

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

  // 2. Emit Real-time Socket Event (New standardized event)
  emitSocketEvent(userId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);

  // 3. Fetch User Preferences
  const preference = await prisma.notification_preference.findUnique({
    where: { userId }
  });

  // 4. Dispatch Background Jobs via Inngest for External Channels
  // We respect user preferences if they exist, otherwise default to smart defaults
  const channels = {
    email: preference ? preference.email : true,
    sms: preference ? preference.sms : (priority === 'URGENT' || priority === 'HIGH'),
    push: preference ? preference.push : true
  };

  await inngest.send({
    name: "notification/dispatch.external",
    data: {
      notificationId: notification.id,
      userId,
      channels,
      payload: { title, message, category, metadata }
    }
  });

  return notification;
}

/**
 * System-wide notification triggers
 */
export const NotificationTriggers = {
  bookingCreated: async (booking: any) => {
    // To Vendor
    if (booking.vendorprofile) {
      await sendNotification({
        userId: booking.vendorprofile.userId,
        title: "New Booking Request",
        message: `You have a new booking request #${booking.bookingNumber} for ${booking.eventName}.`,
        category: 'BOOKING',
        priority: 'HIGH',
        link: `/vendor/bookings/${booking.id}`,
        metadata: { bookingId: booking.id, bookingNumber: booking.bookingNumber }
      });
    }
  },

  paymentSuccess: async (booking: any, payment: any) => {
    // To Customer
    await sendNotification({
      userId: booking.customerId,
      title: "Payment Successful",
      message: `Your payment of ₹${payment.amount} for booking #${booking.bookingNumber} was successful.`,
      category: 'PAYMENT',
      priority: 'HIGH',
      link: `/customer/bookings/${booking.id}`,
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
    const targetUserId = booking.customerId; // Default to customer
    const link = `/customer/bookings/${booking.id}`;

    // Standard mapping for common statuses
    switch (status) {
      case 'ACCEPTED':
        title = "Booking Accepted! 🎉";
        message = `Vendor ${booking.vendorprofile?.businessName || 'Vendor'} has accepted your booking #${booking.bookingNumber}. Please proceed to payment.`;
        break;
      case 'VENDOR_ASSIGNED':
        title = "Vendor Assigned";
        message = `A vendor has been assigned to your booking #${booking.bookingNumber}.`;
        break;
      case 'CONFIRMED':
        title = "Booking Confirmed";
        message = `Your booking #${booking.bookingNumber} is confirmed!`;
        break;
      case 'VENDOR_TRAVELING':
        title = "Vendor is on the way! 🚗";
        message = `Your vendor for #${booking.bookingNumber} has started traveling to the location.`;
        break;
      case 'VENDOR_ARRIVED':
        title = "Vendor Arrived 📍";
        message = `The vendor has arrived at your location for booking #${booking.bookingNumber}.`;
        break;
      case 'EVENT_STARTED':
        title = "Event Started 🚀";
        message = `Your event "${booking.eventName}" has officially started! Enjoy!`;
        break;
      case 'EVENT_COMPLETED':
        title = "Event Completed ✨";
        message = `We hope you enjoyed the event! Please take a moment to rate ${booking.vendorprofile?.businessName || 'the vendor'}.`;
        break;
      case 'REJECTED':
        title = "Booking Rejected";
        message = `We're sorry, your booking #${booking.bookingNumber} was rejected by the vendor.`;
        break;
      default:
        // Generic fall-back
        title = "Booking Update";
        message = `The status of your booking #${booking.bookingNumber} has changed to ${status}.`;
    }

    const notification = await sendNotification({
      userId: targetUserId,
      title,
      message,
      category: 'BOOKING',
      priority: 'MEDIUM',
      link,
      metadata: { bookingId: booking.id, status }
    });

    // Also emit a raw booking update event for immediate state refresh
    emitSocketEvent(targetUserId, SOCKET_EVENTS.BOOKING_NEGOTIATING, { // Generic booking update
        bookingId: booking.id,
        status,
        message
    });

    return notification;
  },

  bookingCancelled: async (booking: any, reason: string) => {
    // To Other Party
    const targetUserId = booking.status === 'CANCELLED' ? booking.vendorprofile?.userId : booking.customerId;
    if (targetUserId) {
      await sendNotification({
        userId: targetUserId,
        title: "Booking Cancelled",
        message: `Booking #${booking.bookingNumber} has been cancelled. Reason: ${reason}`,
        category: 'BOOKING',
        priority: 'HIGH',
        metadata: { bookingId: booking.id }
      });
    }
  }
};

export const NotificationService = {
  send: sendNotification,
  triggers: NotificationTriggers,
};
