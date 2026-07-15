import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ReferralService } from "@/services/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const stats = await ReferralService.getReferralStats(session.user.id);
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "Failed to fetch referral stats" }, { status: 500 });
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const code = await ReferralService.generateReferralCode(session.user.id);
    return NextResponse.json({ code });
  } catch {
    return NextResponse.json({ error: "Failed to generate referral code" }, { status: 500 });
  }
}
