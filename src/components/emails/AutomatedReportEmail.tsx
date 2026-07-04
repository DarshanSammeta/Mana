import * as React from 'react';

interface AutomatedReportEmailProps {
  businessName: string;
  reportFrequency: string;
  startDate: string;
  endDate: string;
}

export const AutomatedReportEmail: React.FC<Readonly<AutomatedReportEmailProps>> = ({
  businessName,
  reportFrequency,
  startDate,
  endDate,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
    <h1 style={{ color: '#8b5cf6' }}>Monthly Business Report</h1>
    <p>Hello {businessName},</p>
    <p>
      Your {reportFrequency.toLowerCase()} automated business reports for the period <strong>{startDate}</strong> to <strong>{endDate}</strong> are attached to this email.
    </p>
    <p>These reports include detailed insights into your bookings, revenue, and transactions on Mana Events.</p>
    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
      <p style={{ margin: 0 }}><strong>Plan:</strong> Elite/Gold Member Benefit</p>
      <p style={{ margin: 0 }}><strong>Status:</strong> Automated Delivery</p>
    </div>
    <p style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
      If you wish to change your report settings or unsubscribe from automated reports, please visit your Vendor Dashboard.
    </p>
    <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
    <p style={{ fontSize: '12px', color: '#999' }}>© {new Date().getFullYear()} Mana Events. All rights reserved.</p>
  </div>
);
