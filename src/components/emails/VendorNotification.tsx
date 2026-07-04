import React from 'react';
import { APP_CONFIG } from '@/config/app';

interface VendorNotificationEmailProps {
  vendorName: string;
  bookingNumber: string;
  eventName: string;
  eventDate: string;
  customerName: string;
  payoutAmount: string;
}

export const VendorNotificationEmail = ({
  vendorName,
  bookingNumber,
  eventName,
  eventDate,
  customerName,
  payoutAmount,
}: VendorNotificationEmailProps) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#1a1a1a', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
    <h1 style={{ color: '#2563EB', fontSize: '24px', fontWeight: 'bold' }}>New Booking Request!</h1>
    <p>Hi {vendorName},</p>
    <p>You have received a new booking request for <strong>{eventName}</strong> from {customerName}.</p>

    <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
      <p style={{ margin: '5px 0' }}><strong>Booking ID:</strong> {bookingNumber}</p>
      <p style={{ margin: '5px 0' }}><strong>Event Date:</strong> {eventDate}</p>
      <p style={{ margin: '5px 0', color: '#1E293B', fontWeight: 'bold' }}><strong>Estimated Payout:</strong> ₹{payoutAmount}</p>
    </div>

    <p>Please log in to your Seller Central dashboard to accept or decline this request within the next 4 hours.</p>

    <a
      href={`${APP_CONFIG.url}/vendor/dashboard`}
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
      Go to Dashboard
    </a>

    <p style={{ marginTop: '40px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
      <strong>Mana Events</strong> Seller Central<br />
      Helping you grow your event business.
    </p>
  </div>
);
