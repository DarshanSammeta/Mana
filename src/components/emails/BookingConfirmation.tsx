import React from 'react';
import { APP_CONFIG } from '@/config/app';

interface BookingConfirmationEmailProps {
  customerName: string;
  bookingNumber: string;
  eventName: string;
  eventDate: string;
  totalAmount: string;
}

export const BookingConfirmationEmail = ({
  customerName,
  bookingNumber,
  eventName,
  eventDate,
  totalAmount,
}: BookingConfirmationEmailProps) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#1a1a1a', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
    <h1 style={{ color: '#2563EB', fontSize: '24px', fontWeight: 'bold' }}>Booking Confirmed!</h1>
    <p>Hi {customerName},</p>
    <p>Your booking for <strong>{eventName}</strong> has been successfully confirmed.</p>

    <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
      <p style={{ margin: '5px 0' }}><strong>Booking ID:</strong> {bookingNumber}</p>
      <p style={{ margin: '5px 0' }}><strong>Event Date:</strong> {eventDate}</p>
      <p style={{ margin: '5px 0', color: '#1E293B', fontWeight: 'bold' }}><strong>Total Amount:</strong> ₹{totalAmount}</p>
    </div>

    <p>You can track your booking status and communicate with your vendor through your dashboard.</p>

    <a
      href={`${APP_CONFIG.url}/customer/orders`}
      style={{
        display: 'inline-block',
        backgroundColor: '#2563EB',
        color: 'white',
        padding: '14px 28px',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: 'bold',
        marginTop: '20px',
        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
      }}
    >
      View Booking
    </a>

    <p style={{ marginTop: '40px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
      Best regards,<br />
      <strong>The Mana Events Team</strong>
    </p>
  </div>
);
