import { PrismaClient } from '@prisma/client';
import { AuditService } from '../src/services/server/audit.service';

const prisma = new PrismaClient();

async function run() {
  console.log('--- TESTING ATOMICITY ---');

  try {
    const vendor = await prisma.vendorprofile.findFirst();
    if (!vendor) {
      console.error('No vendor found to test with.');
      return;
    }

    const originalStatus = vendor.verificationStatus;
    const testAction = 'ATOM_TEST_' + Date.now();
    console.log(`Initial State - Vendor: ${vendor.id}, Status: ${originalStatus}`);

    try {
      await prisma.$transaction(async (tx) => {
        console.log('Action 1: Updating vendor status to PENDING...');
        await tx.vendorprofile.update({
          where: { id: vendor.id },
          data: { verificationStatus: 'PENDING' }
        });

        console.log('Action 2: Creating audit log in same transaction...');
        await AuditService.logVendorAction(
          vendor.id,
          testAction,
          { id: 'test-admin', role: 'ADMIN', name: 'Test Admin' },
          { newStatus: 'PENDING' },
          tx
        );

        console.log('Action 3: Throwing deliberate error to force rollback...');
        throw new Error('FORCED_ROLLBACK_ERROR');
      });
    } catch (err: any) {
      if (err.message === 'FORCED_ROLLBACK_ERROR') {
        console.log('Caught expected error. Transaction should have rolled back.');
      } else {
        console.error('Unexpected error during transaction:', err);
      }
    }

    // Verification
    const updatedVendor = await prisma.vendorprofile.findUnique({ where: { id: vendor.id } });
    const auditLog = await prisma.audit_log.findFirst({ where: { action: testAction } });

    console.log('--- VERIFICATION ---');
    console.log('Final Vendor Status:', updatedVendor?.verificationStatus);
    console.log('Audit Log Exists?', !!auditLog);

    if (updatedVendor?.verificationStatus === originalStatus && !auditLog) {
      console.log('RESULT: PASS');
    } else {
      console.log('RESULT: FAIL');
    }

  } catch (error) {
    console.error('Test Execution Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
