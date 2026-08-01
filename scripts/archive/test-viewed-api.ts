import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- VIEWED API LOGIC VERIFICATION ---");

  try {
    const booking = await prisma.booking.findFirst({
        include: { vendorprofile: true }
    });

    if (!booking) throw new Error("No booking found.");

    console.log(`Testing viewedByVendor for booking ${booking.bookingNumber}...`);
    console.log("Current status:", booking.viewedByVendor);

    const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { viewedByVendor: true }
    });

    console.log("Updated status:", updated.viewedByVendor);

    if (updated.viewedByVendor === true) {
        console.log("✅ viewedByVendor Field: OK");
    } else {
        console.error("❌ viewedByVendor Field: FAILED");
    }

    // Reset for next test if needed
    await prisma.booking.update({
        where: { id: booking.id },
        data: { viewedByVendor: false }
    });

  } catch (e: any) {
    console.error("❌ Viewed API Test Failed:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
