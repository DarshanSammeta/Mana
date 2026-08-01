const { AuditService } = require('../src/services/server/audit.service');
require('dotenv').config();

async function run() {
  console.log('Testing AuditService.log for Payment Failure...');
  try {
    const result = await AuditService.log({
      entityType: "PAYMENT",
      entityId: "test_order_id",
      bookingId: "test_booking_id",
      module: "FINANCE",
      action: "PAYMENT_VERIFICATION_FAILED",
      performedByUserId: "test_user_id",
      performedByRole: "CUSTOMER",
      metadata: { razorpay_order_id: "test_order_id", bookingId: "test_booking_id", reason: "Invalid signature" },
      ipAddress: "127.0.0.1"
    });
    console.log('Audit Log Created Successfully:', result.id);
  } catch (error) {
    console.error('Audit Log Failed:', error);
  }
}

run();
