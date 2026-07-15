import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MarketingService } from "@/services/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  const campaigns = await MarketingService.getCampaigns({
    ...(status && { status }),
    ...(type && { type }),
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const campaign = await MarketingService.createCampaign(body);
    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
