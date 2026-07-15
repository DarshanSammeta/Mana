import React from 'react';
import { APP_CONFIG } from '@/config/app';

export type VerificationStatus = 'APPROVED' | 'REJECTED' | 'CHANGES_REQUIRED';

interface VendorVerificationEmailProps {
  vendorName: string;
  status: VerificationStatus;
  message: string;
  rejectionReason?: string;
}

export const VendorVerificationEmail = ({
  vendorName,
  status,
  message,
  rejectionReason,
}: VendorVerificationEmailProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'APPROVED': return '#10B981';
      case 'REJECTED': return '#EF4444';
      case 'CHANGES_REQUIRED': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'APPROVED': return 'Verification Approved! 🎉';
      case 'REJECTED': return 'Verification Unsuccessful';
      case 'CHANGES_REQUIRED': return 'Action Required: Changes Needed';
      default: return 'Verification Update';
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#1a1a1a', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: getStatusColor(), fontSize: '24px', fontWeight: 'bold' }}>{getStatusTitle()}</h1>
      <p>Hi {vendorName},</p>
      <p>{message}</p>

      {rejectionReason && (
        <div style={{ backgroundColor: '#FEF2F2', padding: '20px', borderRadius: '12px', border: '1px solid #FEE2E2', margin: '20px 0' }}>
          <p style={{ margin: '0', color: '#991B1B', fontWeight: 'bold' }}>Reason for Rejection/Feedback:</p>
          <p style={{ margin: '10px 0 0 0', color: '#B91C1C' }}>{rejectionReason}</p>
        </div>
      )}

      <p style={{ marginTop: '20px' }}>
        Please log in to your dashboard for more details and to take any necessary actions.
      </p>

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
};
