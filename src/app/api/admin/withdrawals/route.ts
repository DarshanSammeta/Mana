import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    const where: any = {};
    if (status !== "all") {
        where.status = status.toUpperCase();
    }

    const withdrawals = await prisma.vendor_payout.findMany({
      where,
      include: {
          vendor: { select: { businessName: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const rows = withdrawals.map(w => ({
        id: w.id,
        vendor_name: w.vendor.businessName,
        amount: Number(w.amount),
        status: w.status.toLowerCase(),
        method: "bank_transfer",
        created_at: w.createdAt
    }));

    return NextResponse.json({ rows, total: rows.length });
  }, req);
}
