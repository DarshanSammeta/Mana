import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MarketingService } from "@/services/server";

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();

  try {
    const event = await MarketingService.trackMarketingEvent({
      ...body,
      userId: session?.user?.id,
    });
    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
