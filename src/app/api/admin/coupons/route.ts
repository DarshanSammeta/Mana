import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const coupons = await prisma.coupon.findMany({
      orderBy: { expiryDate: "desc" }
    });

    const rows = coupons.map(c => ({
        id: c.id,
        code: c.code,
        discount_type: c.discountType.toLowerCase(),
        discount_value: Number(c.discountValue),
        min_order: Number(c.minBookingAmount || 0),
        valid_to: c.expiryDate,
        is_active: c.isActive,
        used_count: 0,
        max_uses: null
    }));

    return NextResponse.json(rows);
  }, req);
}
