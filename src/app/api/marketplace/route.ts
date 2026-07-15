import { NextResponse } from "next/server";
import { getMarketplaceVendors } from "@/lib/marketplace";
import { withErrorHandler } from "@/lib/error-handler";

import logger from "@/lib/logger";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const startTime = process.hrtime();
  return withErrorHandler(async () => {
    const { searchParams } = new URL(req.url);
    const filters = {
      category: searchParams.get("category") || undefined,
      eventTypeId: searchParams.get("eventTypeId") || undefined,
      city: searchParams.get("city") || undefined,
      query: searchParams.get("query") || undefined,
      minPrice: searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined,
      maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined,
      rating: searchParams.get("rating") ? parseFloat(searchParams.get("rating")!) : undefined,
      sort: searchParams.get("sort") || "featured",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "12"),
      lat: searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined,
      lng: searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined,
    };

    const result = await getMarketplaceVendors(filters);

    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
    logger.info(`Marketplace API Performance: ${duration}ms`, { filters });

    return NextResponse.json({
      vendors: result.vendors,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  }, req);
}

