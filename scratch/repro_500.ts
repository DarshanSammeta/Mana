import { pricingService } from "../src/services/server/pricing.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function repro() {
  // Test case: addonIds is []
  // We need a real packageId from the DB
  const pkg = await prisma.renamedpackage.findFirst({
      select: { id: true, name: true, price: true }
  });

  if (!pkg) {
      console.log("No package found to test.");
      return;
  }

  console.log("Testing with package:", pkg.name, pkg.id);
  console.log("Input: addonIds = []");

  try {
      const result = await pricingService.calculateBookingPrice({
          packageId: pkg.id,
          guestCount: 100,
          addonIds: []
      });
      console.log("Result (Total):", result.total);

      // Verification: Check if any addons were included
      console.log("Addons included:", result.addonsDetail.length);
      if (result.addonsDetail.length > 0) {
          console.error("BUG CONFIRMED: Addons were included even though addonIds was []");
      } else {
          console.log("No addons included (Expected behavior if fixed, or maybe no active addons exist for this pkg)");
      }
  } catch (e: any) {
      console.error("Calculation failed with error:", e.message);
      console.error(e.stack);
  } finally {
      await prisma.$disconnect();
  }
}

repro();
