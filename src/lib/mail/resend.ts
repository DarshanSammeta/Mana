import "server-only";
import { Resend } from 'resend';
import { BookingConfirmationEmail } from '@/components/emails/BookingConfirmation';
import { VendorNotificationEmail } from '@/components/emails/VendorNotification';
import { VendorVerificationEmail, VerificationStatus } from '@/components/emails/VendorVerificationEmail';
import { InvoiceEmail } from '@/components/emails/InvoiceEmail';
import { RefundEmail } from '@/components/emails/RefundEmail';
import React from 'react';

import { EMAIL_CONFIG } from '@/config/email';

// Initialize lazily to avoid build-time errors when API key is missing
let resendInstance: Resend | null = null;

const getResend = () => {
  if (typeof window !== "undefined") {
    return null;
  }

  if (resendInstance) return resendInstance;
  const apiKey = EMAIL_CONFIG.resendApiKey;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is missing, Resend service will be unavailable.');
    return null;
  }

  try {
    resendInstance = new Resend(apiKey);
    return resendInstance;
  } catch (error) {
    console.error('Failed to initialize Resend:', error);
    return null;
  }
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
    if (!resend) return;

    await resend.emails.send({
      from: EMAIL_CONFIG.from.bookings,
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
    if (!resend) return;

    await resend.emails.send({
      from: EMAIL_CONFIG.from.seller,
      to: email,
      subject: `New Booking Request - ${data.bookingNumber}`,
      react: React.createElement(VendorNotificationEmail, data),
    });
  } catch (error) {
    console.error('Vendor Email sending failed:', error);
  }
};

export const sendInvoiceEmail = async (
  email: string,
  data: {
    customerName: string;
    invoiceNumber: string;
    bookingNumber: string;
    amount: string;
    pdfUrl: string;
  }
) => {
  try {
    const resend = getResend();
    if (!resend) return;

    await resend.emails.send({
      from: EMAIL_CONFIG.from.bookings,
      to: email,
      subject: `Your Invoice for Booking ${data.bookingNumber}`,
      react: React.createElement(InvoiceEmail, data),
    });
  } catch (error) {
    console.error('Invoice Email sending failed:', error);
  }
};

export const sendRefundEmail = async (
  email: string,
  data: {
    customerName: string;
    bookingNumber: string;
    amount: string;
    reason: string;
  }
) => {
  try {
    const resend = getResend();
    if (!resend) return;

    await resend.emails.send({
      from: EMAIL_CONFIG.from.bookings,
      to: email,
      subject: `Refund Processed - ${data.bookingNumber}`,
      react: React.createElement(RefundEmail, data),
    });
  } catch (error) {
    console.error('Refund Email sending failed:', error);
  }
};

export const sendVendorVerificationUpdateEmail = async (
  email: string,
  data: {
    vendorName: string;
    status: VerificationStatus;
    message: string;
    rejectionReason?: string;
  }
) => {
  try {
    const resend = getResend();
    if (!resend) return;

    await resend.emails.send({
      from: EMAIL_CONFIG.from.auth,
      to: email,
      subject: `Account Verification Update - ${data.status}`,
      react: React.createElement(VendorVerificationEmail, data),
    });
  } catch (error) {
    console.error('Vendor Verification Email sending failed:', error);
  }
};

export const sendOTPEmail = async (email: string, otp: string) => {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn('Resend API key missing, skipping OTP email');
      return;
    }
    await resend.emails.send({
      from: EMAIL_CONFIG.from.auth,
      to: email,
      subject: 'Your Mana Event Verification Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Verification Code</h2>
          <p>Your one-time password (OTP) for Mana Event is:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; color: #2563eb;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('OTP Email sending failed:', error);
    throw error;
  }
};
