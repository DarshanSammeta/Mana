import { NextResponse } from "next/server";
import { getTrendingSearches } from "@/lib/intelligence/search-analytics";

export async function GET() {
  try {
    const trending = await getTrendingSearches();
    return NextResponse.json(trending);
  } catch {
    return NextResponse.json([]);
  }
}
