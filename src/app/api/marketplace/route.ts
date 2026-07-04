import { NextResponse } from "next/server";
import { getMarketplaceVendors } from "@/lib/marketplace";
import { withErrorHandler } from "@/lib/error-handler";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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

    return NextResponse.json({
      vendors: result.vendors,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  });
}
