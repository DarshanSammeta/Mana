import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";
import { pricingService } from "../src/services/server/pricing.service";

const prisma = new PrismaClient();

async function main() {
  console.log("--- BOOKING CREATION LOGIC VERIFICATION ---");

  try {
    // 1. Find a test vendor/package
    const pkg = await prisma.renamedpackage.findFirst({
        include: { service: { include: { vendorprofile: true, servicetype: { include: { subcategory: { include: { category: { include: { eventtype: true } } } } } } } } }
    });

    if (!pkg) throw new Error("No package found. Run seed.");

    const guestCount = 150;
    console.log(`Testing pricing for ${pkg.name} with ${guestCount} guests...`);

    // 2. Test Pricing Calculation
    const pricing = await pricingService.calculateBookingPrice({
        packageId: pkg.id,
        guestCount,
        addonIds: []
    });

    console.log("Pricing Results:", {
        subtotal: pricing.subtotal,
        total: pricing.total,
        advance: pricing.advanceAmount,
        breakdown: pricing.breakdown
    });

    if (pricing.total > 0 && pricing.advanceAmount === pricing.total * 0.3) {
        console.log("✅ Pricing Logic: OK");
    } else {
        console.error("❌ Pricing Logic: FAILED (Calculation mismatch)");
    }

    // 3. Test Hierarchy Validation
    const validation = await pricingService.validateHierarchy({
        eventTypeId: pkg.service.servicetype.subcategory.category.eventTypeId,
        categoryId: pkg.service.servicetype.subcategory.categoryId,
        subcategoryId: pkg.service.servicetype.subcategory.id,
        serviceTypeId: pkg.service.servicetype.id,
        packageId: pkg.id
    });

    if (validation.valid) {
        console.log("✅ Hierarchy Validation: OK");
    } else {
        console.error("❌ Hierarchy Validation: FAILED", validation.message);
    }

  } catch (e: any) {
    console.error("❌ Booking Logic Failed:", e.message);
    if (e.stack) console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
