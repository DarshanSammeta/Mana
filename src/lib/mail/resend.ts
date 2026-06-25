import { Resend } from 'resend';
import { BookingConfirmationEmail } from '@/components/emails/BookingConfirmation';
import { VendorNotificationEmail } from '@/components/emails/VendorNotification';
import React from 'react';

// Initialize lazily to avoid build-time errors when API key is missing
let resendInstance: Resend | null = null;

const getResend = () => {
  if (resendInstance) return resendInstance;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resendInstance = new Resend(apiKey);
  return resendInstance;
};

export const sendBookingConfirmationEmail = async (
  email: string,
  data: {
    customerName: string;
    bookingNumber: string;
    eventName: string;
    eventDate: string;
    totalAmount: string;
  }
) => {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn('Resend API key missing, skipping email');
      return;
    }
    await resend.emails.send({
      from: 'Mana Events <bookings@manaevents.in>',
      to: email,
      subject: `Booking Confirmed - ${data.bookingNumber}`,
      react: React.createElement(BookingConfirmationEmail, data),
    });
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

export const sendVendorNotificationEmail = async (
  email: string,
  data: {
    vendorName: string;
    bookingNumber: string;
    eventName: string;
    eventDate: string;
    customerName: string;
    payoutAmount: string;
  }
) => {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn('Resend API key missing, skipping vendor email');
      return;
    }
    await resend.emails.send({
      from: 'Mana Events <seller-alerts@manaevents.in>',
      to: email,
      subject: `New Booking Request - ${data.bookingNumber}`,
      react: React.createElement(VendorNotificationEmail, data),
    });
  } catch (error) {
    console.error('Vendor Email sending failed:', error);
  }
};
