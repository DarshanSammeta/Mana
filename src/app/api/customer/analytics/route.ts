import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CustomerAnalyticsService } from "@/services/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const analytics = await CustomerAnalyticsService.getAnalytics(session.user.id);
    return NextResponse.json(analytics);
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
