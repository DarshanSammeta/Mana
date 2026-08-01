import { prisma } from "@/lib/prisma";

export class OfferService {
  /**
   * Priority: Referral -> Festival -> Vendor Offer -> Coupon -> Wallet -> Credits
   */
  static async getBestOffer(customerId: string, orderTotal: number) {
    const [referrals, coupons] = await Promise.all([
      prisma.referral.findMany({ where: { referredId: customerId, status: "PENDING" } }),
      prisma.coupon.findMany({ where: { isActive: true, expiryDate: { gt: new Date() } } }),
    ]);

    const potentialDiscounts = [];

    // 1. Referral Discounts
    if (referrals.length > 0) {
      potentialDiscounts.push({
        type: "REFERRAL",
        value: 500, // Example flat discount
        priority: 1
      });
    }

    // 2. Coupons (Find best one)
    for (const coupon of coupons) {
        let value = 0;
        if (coupon.discountType === "PERCENTAGE") {
            value = (orderTotal * Number(coupon.discountValue)) / 100;
        } else {
            value = Number(coupon.discountValue);
        }

        if (coupon.maxDiscount) {
            value = Math.min(value, Number(coupon.maxDiscount));
        }

        potentialDiscounts.push({
            type: "COUPON",
            code: coupon.code,
            value,
            priority: 4
        });
    }

    // Sort by value descending, then priority
    return potentialDiscounts.sort((a, b) => b.value - a.value || a.priority - b.priority)[0];
  }
}
