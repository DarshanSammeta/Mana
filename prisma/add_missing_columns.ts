import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Adding missing columns to vendorprofile table...");

  const columns = [
    { name: 'approvedAt', type: 'TIMESTAMP WITH TIME ZONE' },
    { name: 'approvedBy', type: 'TEXT' },
    { name: 'rejectedAt', type: 'TIMESTAMP WITH TIME ZONE' },
    { name: 'rejectedBy', type: 'TEXT' },
    { name: 'suspendedAt', type: 'TIMESTAMP WITH TIME ZONE' },
    { name: 'suspendedBy', type: 'TEXT' },
    { name: 'suspensionReason', type: 'TEXT' },
    { name: 'reviewedAt', type: 'TIMESTAMP WITH TIME ZONE' }
  ];

  for (const col of columns) {
    try {
      console.log(`Adding column: ${col.name}...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "vendorprofile" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
      console.log(`[SUCCESS] Added ${col.name}`);
    } catch (error: any) {
      console.error(`[ERROR] Failed to add ${col.name}:`, error.message);
    }
  }

  // Also update enum values if needed
  // In Postgres, adding values to an enum is a bit different
  try {
    console.log("Updating vendorprofile_verificationStatus enum...");
    // We can't use IF NOT EXISTS for ADD VALUE in some versions of Postgres
    // So we just try and catch
    await prisma.$executeRawUnsafe(`ALTER TYPE "vendorprofile_verificationStatus" ADD VALUE 'UNDER_REVIEW'`);
    console.log("[SUCCESS] Added UNDER_REVIEW to enum");
  } catch (error: any) {
    console.warn("[SKIP] Could not add UNDER_REVIEW (might already exist):", error.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "booking_status" ADD VALUE 'PENDING_VENDOR_RESPONSE'`);
    console.log("[SUCCESS] Added PENDING_VENDOR_RESPONSE to enum");
  } catch (error: any) {
     console.warn("[SKIP] Could not add PENDING_VENDOR_RESPONSE (might already exist):", error.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "booking_status" ADD VALUE 'COUNTERED'`);
    console.log("[SUCCESS] Added COUNTERED to enum");
  } catch (error: any) {
     console.warn("[SKIP] Could not add COUNTERED (might already exist):", error.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "booking_status" ADD VALUE 'ADVANCE_PAYMENT_PENDING'`);
    console.log("[SUCCESS] Added ADVANCE_PAYMENT_PENDING to enum");
  } catch (error: any) {
     console.warn("[SKIP] Could not add ADVANCE_PAYMENT_PENDING (might already exist):", error.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "booking_status" ADD VALUE 'COUNTER_REJECTED'`);
    console.log("[SUCCESS] Added COUNTER_REJECTED to enum");
  } catch (error: any) {
     console.warn("[SKIP] Could not add COUNTER_REJECTED (might already exist):", error.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "booking_status" ADD VALUE 'PAYMENT_EXPIRED'`);
    console.log("[SUCCESS] Added PAYMENT_EXPIRED to enum");
  } catch (error: any) {
     console.warn("[SKIP] Could not add PAYMENT_EXPIRED (might already exist):", error.message);
  }

}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
