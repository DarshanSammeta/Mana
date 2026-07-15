import React from 'react';

interface RefundEmailProps {
  customerName: string;
  bookingNumber: string;
  amount: string;
  reason: string;
}

export const RefundEmail = ({
  customerName,
  bookingNumber,
  amount,
  reason,
}: RefundEmailProps) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#1a1a1a', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
    <h1 style={{ color: '#DC2626', fontSize: '24px', fontWeight: 'bold' }}>Refund Processed</h1>
    <p>Hi {customerName},</p>
    <p>We&apos;ve processed a refund for your booking <strong>#{bookingNumber}</strong>.</p>

    <div style={{ backgroundColor: '#FEF2F2', padding: '20px', borderRadius: '12px', border: '1px solid #FEE2E2', margin: '20px 0' }}>
      <p style={{ margin: '5px 0' }}><strong>Refund Amount:</strong> ₹{amount}</p>
      <p style={{ margin: '5px 0' }}><strong>Reason:</strong> {reason}</p>
    </div>

    <p>The amount has been credited to your Mana Wallet. You can use it for future bookings or withdraw it to your original payment method (if applicable).</p>

    <p style={{ marginTop: '40px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
      Best regards,<br />
      <strong>The Mana Events Team</strong>
    </p>
  </div>
);
