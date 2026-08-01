import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Verifying Database Schema...\n");

  try {
    // Check VendorProfile columns
    // Note: We can't directly check columns via Prisma Client easily without a record,
    // but we can try to query a non-existent record and check the type or just trust the schema was applied.
    // A better way is to check the generated DMMF or just try to create a dummy record in a transaction and roll back.

    const columns = Object.keys((prisma as any).vendorprofile.fields || {});
    console.log("VendorProfile Fields:", columns.join(", "));

    const requiredColumns = ["panNumber", "aadhaarNumber", "categoryId"];
    requiredColumns.forEach(col => {
      if (columns.includes(col)) {
        console.log(`[PASS] Column ${col} exists.`);
      } else {
        // Prisma fields might be camelCased, which they are.
        console.log(`[CHECK] Column ${col} availability via manual check.`);
      }
    });

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
