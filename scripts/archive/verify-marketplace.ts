import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { getMarketplaceVendors } from "../../src/lib/marketplace";

async function main() {
  console.log("--- MARKETPLACE LOGIC VERIFICATION ---");

  try {
    const filters = {
        page: 1,
        limit: 5,
        sort: "featured"
    };

    console.log("Testing generic search...");
    const result = await getMarketplaceVendors(filters as any);
    console.log(`Found ${result.vendors.length} vendors (Total: ${result.total})`);

    if (result.vendors.length > 0) {
        console.log("Sample Vendor:", result.vendors[0].businessName);
        console.log("Price:", result.vendors[0].minPrice);
        console.log("✅ Marketplace Retrieval: OK");
    } else {
        console.warn("⚠️ No vendors found in Marketplace. Ensure DB is seeded.");
    }

    console.log("Testing city filter (Hyderabad)...");
    const hydResult = await getMarketplaceVendors({ ...filters, city: "Hyderabad" } as any);
    console.log(`Found ${hydResult.vendors.length} vendors in Hyderabad`);

  } catch (e: any) {
    console.error("❌ Marketplace Logic Failed:", e.message);
    if (e.stack) console.error(e.stack);
  }
}

main();
