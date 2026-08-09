import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const referrals = await prisma.referral.findMany({
      include: {
          referred: { include: { user: { select: { fullName: true, email: true } } } },
          referrer: { include: { user: { select: { fullName: true } } } }
      },
      orderBy: { createdAt: "desc" }
    });

    const rows = referrals.map(r => ({
        id: r.id,
        code: r.code || "—",
        referee: r.referred.user.fullName,
        referrer: r.referrer.user.fullName || "—",
        referred: r.referred.user.fullName,
        reward_amount: r.rewardPoints,
        status: r.status.toLowerCase(),
        earned: r.rewardPoints,
        created_at: r.createdAt
    }));

    return NextResponse.json(rows);
  }, req);
}
