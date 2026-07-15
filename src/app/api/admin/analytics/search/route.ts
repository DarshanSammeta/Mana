import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";
import { getTrendingSearches, getSearchHeatmap } from "@/lib/intelligence/search-analytics";

export async function GET(req: Request) {
  const payload = await getAuthPayload(req);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const city = searchParams.get("city") || undefined;

  try {
    const [trending, heatmap, summary] = await Promise.all([
      getTrendingSearches(10),
      getSearchHeatmap(category, city),
      prisma.search_analytics.groupBy({
          by: ['category'],
          _count: { _all: true },
          where: {
              createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
          },
          orderBy: {
              _count: { category: 'desc' }
          },
          take: 5
      })
    ]);

    return NextResponse.json({
        trending,
        heatmap,
        summary
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
