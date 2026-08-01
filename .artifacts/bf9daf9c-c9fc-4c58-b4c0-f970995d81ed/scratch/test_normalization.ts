
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Mocking normalizeFeatures from src/lib/vendor.ts logic
function normalizeFeatures(features: any): string[] {
  console.log("Input features type:", typeof features);
  console.log("Input features data:", JSON.stringify(features));

  if (features === null || features === undefined) return [];

  let val = features;

  if (typeof val === 'string') {
    try {
      val = JSON.parse(val);
      console.log("Parsed string to:", typeof val);
    } catch {
      return [];
    }
  }

  if (Array.isArray(val)) {
    console.log("Is array, filtering...");
    return val.filter((item: any) => typeof item === 'string');
  }

  if (typeof val === 'object' && val !== null) {
    console.log("Is object, entries mapping...");
    return Object.entries(val)
      .filter(([_, enabled]) => !!enabled)
      .map(([key]) => key);
  }

  return [];
}

async function test() {
  const plans = await prisma.subscriptionplan.findMany();
  console.log("Testing with database plans:");
  for (const plan of plans) {
    console.log(`Plan: ${plan.name}`);
    const normalized = normalizeFeatures(plan.features);
    console.log("Result:", normalized);
    console.log("Is Array?", Array.isArray(normalized));
    console.log("---");
  }
}

test().catch(console.error);
