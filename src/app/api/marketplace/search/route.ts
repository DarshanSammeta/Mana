import { NextResponse } from "next/server";
import { getMarketplaceVendors } from "@/lib/marketplace";
import { auth } from "@/lib/auth";
import { SearchIntelligenceService } from "@/services/server/search-intelligence.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      query: searchParams.get("query") || searchParams.get("q") || undefined,
      city: searchParams.get("city") || undefined,
      category: searchParams.get("category") || undefined,
      lat: searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined,
      lng: searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined,
      minPrice: searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined,
      maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined,
      rating: searchParams.get("rating") ? parseFloat(searchParams.get("rating")!) : undefined,
      sort: searchParams.get("sort") || "featured",
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20,
    };

    const { vendors } = await getMarketplaceVendors(filters);

    // Track search intelligence
    const session = await auth();
    await SearchIntelligenceService.trackSearch(
      filters.query || "",
      session?.user?.id,
      filters,
      vendors.length
    );

    return NextResponse.json(vendors);
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
