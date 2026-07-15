import React from 'react';

interface InvoiceEmailProps {
  customerName: string;
  invoiceNumber: string;
  bookingNumber: string;
  amount: string;
  pdfUrl: string;
}

export const InvoiceEmail = ({
  customerName,
  invoiceNumber,
  bookingNumber,
  amount,
  pdfUrl,
}: InvoiceEmailProps) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#1a1a1a', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
    <h1 style={{ color: '#2563EB', fontSize: '24px', fontWeight: 'bold' }}>Your Invoice is Ready</h1>
    <p>Hi {customerName},</p>
    <p>Thank you for choosing Mana Events. Your invoice for booking <strong>#{bookingNumber}</strong> has been generated.</p>

    <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
      <p style={{ margin: '5px 0' }}><strong>Invoice #:</strong> {invoiceNumber}</p>
      <p style={{ margin: '5px 0' }}><strong>Amount Paid:</strong> ₹{amount}</p>
    </div>

    <p>You can download your invoice using the button below:</p>

    <a
      href={pdfUrl}
      style={{
        display: 'inline-block',
        backgroundColor: '#2563EB',
        color: 'white',
        padding: '14px 28px',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: 'bold',
        marginTop: '20px',
      }}
    >
      Download Invoice (PDF)
    </a>

    <p style={{ marginTop: '40px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
      Best regards,<br />
      <strong>The Mana Events Team</strong>
    </p>
  </div>
);
