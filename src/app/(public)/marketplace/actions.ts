"use server";

import { getMarketplaceVendors, MarketplaceFilters } from "@/lib/marketplace";

export async function fetchMoreVendors(filters: MarketplaceFilters) {
  return await getMarketplaceVendors(filters);
}
