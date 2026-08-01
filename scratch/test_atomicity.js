const { PrismaClient } = require('@prisma/client');
const { AuditService } = require('../dist/services/server/audit.service'); // Note: Need to point to compiled or use ts-node
// Since we are in a JS scratch file, I will use a simplified version of the logic to test the Prisma transaction itself with the new AuditService pattern.

const prisma = new PrismaClient();

async function run() {
  console.log('--- TESTING ATOMICITY ---');

  const vendorId = 'some-valid-vendor-id'; // We need a real ID from the DB
  const testAction = 'TEST_ATOMICITY_ACTION';

  try {
    // Find a vendor first
    const vendor = await prisma.vendorprofile.findFirst();
    if (!vendor) {
      console.error('No vendor found to test with.');
      return;
    }

    console.log(`Testing with vendor: ${vendor.id}, current status: ${vendor.verificationStatus}`);
    const originalStatus = vendor.verificationStatus;
    const targetStatus = originalStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';

    try {
      await prisma.$transaction(async (tx) => {
        console.log('1. Updating vendor status in transaction...');
        await tx.vendorprofile.update({
          where: { id: vendor.id },
          data: { verificationStatus: targetStatus }
        });

        console.log('2. Creating audit log in transaction...');
        // Manually calling the underlying logic of AuditService.log
        // since we are in a JS file and cannot easily import the TS class
        await tx.audit_log.create({
          data: {
            entityType: 'VENDOR',
            entityId: vendor.id,
            module: 'VENDOR_MANAGEMENT',
            action: testAction,
            performedByUserId: 'test-admin-id',
            performedByRole: 'ADMIN',
            performedByName: 'Test Admin',
            newValue: { status: targetStatus }
          }
        });

        console.log('3. Throwing deliberate error to force rollback...');
        throw new Error('FORCED_ROLLBACK_ERROR');
      });
    } catch (err) {
      if (err.message === 'FORCED_ROLLBACK_ERROR') {
        console.log('Caught expected forced rollback error.');
      } else {
        throw err;
      }
    }

    // Verification
    console.log('--- VERIFICATION ---');
    const updatedVendor = await prisma.vendorprofile.findUnique({ where: { id: vendor.id } });
    const auditLog = await prisma.audit_log.findFirst({ where: { action: testAction } });

    console.log('Vendor Status after rollback:', updatedVendor.verificationStatus);
    console.log('Audit Log exists after rollback?', !!auditLog);

    if (updatedVendor.verificationStatus === originalStatus && !auditLog) {
      console.log('PASS: Transaction rolled back successfully. No data committed.');
    } else {
      console.log('FAIL: Data was committed despite error.');
    }

  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
