import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RecommendationService } from "@/services/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const city = searchParams.get("city") || undefined;
    const eventType = searchParams.get("eventType") || undefined;
    const budget = searchParams.get("budget") ? Number(searchParams.get("budget")) : undefined;

    const recommendations = await RecommendationService.getRecommendations({
      userId: session?.user?.id,
      city,
      eventType,
      budget,
    });

    return NextResponse.json(recommendations);
  } catch {
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
