import { prisma } from "./prisma";
import { inngest } from "./inngest";
import crypto from "crypto";

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

  // 2. Fetch User Preferences
  const preference = await prisma.notification_preference.findUnique({
    where: { userId }
  });

  // 3. Dispatch Background Jobs via Inngest for External Channels
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
    await sendNotification({
      userId: booking.vendorprofile.userId,
      title: "New Booking Request",
      message: `You have a new booking request #${booking.bookingNumber} for ${booking.eventName}.`,
      category: 'BOOKING',
      priority: 'HIGH',
      link: `/vendor/bookings/${booking.id}`,
      metadata: { bookingId: booking.id, bookingNumber: booking.bookingNumber }
    });
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
    await sendNotification({
        userId: booking.vendorprofile.userId,
        title: "Booking Confirmed",
        message: `Booking #${booking.bookingNumber} has been confirmed via successful payment.`,
        category: 'BOOKING',
        priority: 'HIGH',
        link: `/vendor/bookings/${booking.id}`,
        metadata: { bookingId: booking.id }
    });
  },

  bookingCancelled: async (booking: any, reason: string) => {
    // To Other Party
    const targetUserId = booking.status === 'CANCELLED' ? booking.vendorprofile.userId : booking.customerId;
    await sendNotification({
      userId: targetUserId,
      title: "Booking Cancelled",
      message: `Booking #${booking.bookingNumber} has been cancelled. Reason: ${reason}`,
      category: 'BOOKING',
      priority: 'HIGH',
      metadata: { bookingId: booking.id }
    });
  }
};
