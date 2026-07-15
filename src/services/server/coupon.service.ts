import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("coupon.service can only be used on the server.");
}

export class CouponService {
  static async validateCoupon(code: string, userId: string, bookingAmount: number, vendorId?: string, categoryId?: string) {
    const prisma = getPrisma();
    const coupon = await prisma.coupon.findUnique({
      where: { code, isActive: true },
    });

    if (!coupon) throw new Error("Invalid or expired coupon");
    if (new Date() > coupon.expiryDate) throw new Error("Coupon has expired");
    if (coupon.usedCount >= coupon.usageLimit) throw new Error("Coupon usage limit reached");

    if (coupon.minBookingAmount && bookingAmount < Number(coupon.minBookingAmount)) {
      throw new Error(`Minimum booking amount of ₹${coupon.minBookingAmount} required`);
    }

    if (coupon.vendorRestrict && vendorId && coupon.vendorRestrict !== vendorId) {
      throw new Error("This coupon is not valid for this vendor");
    }

    if (coupon.categoryRestrict && categoryId && coupon.categoryRestrict !== categoryId) {
      throw new Error("This coupon is not valid for this category");
    }

    if (coupon.isFirstBooking) {
      const previousBookings = await prisma.booking.count({
        where: { customerId: userId, status: { not: "CANCELLED" } }
      });
      if (previousBookings > 0) throw new Error("This coupon is only for your first booking");
    }

    // Check user-specific usage limit if needed (adding usedCount per user would require a new table)

    return coupon;
  }

  static async calculateDiscount(code: string, bookingAmount: number) {
    const prisma = getPrisma();
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) return 0;

    let discount = 0;
    if (coupon.discountType === "FLAT") {
      discount = Number(coupon.discountValue);
    } else if (coupon.discountType === "PERCENTAGE") {
      discount = (bookingAmount * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    }

    return discount;
  }

  static async applyCoupon(code: string, bookingId: string) {
    const prisma = getPrisma();
    return await prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({ where: { code } });
      if (!coupon) throw new Error("Coupon not found");

      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } }
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { couponId: coupon.id }
      });

      return true;
    });
  }
}
