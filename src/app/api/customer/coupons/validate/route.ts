import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CouponService } from "@/services/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { code, bookingAmount, vendorId, categoryId } = await req.json();
    const coupon = await CouponService.validateCoupon(code, session.user.id, bookingAmount, vendorId, categoryId);
    const discount = await CouponService.calculateDiscount(code, bookingAmount);

    return NextResponse.json({ coupon, discount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
