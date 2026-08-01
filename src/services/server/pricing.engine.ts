import { prisma } from "@/lib/prisma";
import { BUSINESS_CONFIG } from "@/constants/config";
import { Prisma } from "@prisma/client";

export interface PricingItem {
  packageId: string;
  guestCount: number;
  addonIds: string[];
}

export interface PricingBreakdown {
  packageAmount: number;
  guestScaling: number;
  addonAmount: number;
  subtotal: number;
  vendorDiscount: number;
  platformDiscount: number;
  couponDiscount: number;
  taxableAmount: number;
  gstAmount: number;
  platformFee: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
}

export interface MultiItemPricing {
  items: Array<{
    packageId: string;
    vendorId: string;
    details: any;
    breakdown: PricingBreakdown;
  }>;
  totalPackageAmount: number;
  totalAddonAmount: number;
  totalSubtotal: number;
  totalVendorDiscount: number;
  totalPlatformDiscount: number;
  totalCouponDiscount: number;
  totalGst: number;
  totalPlatformFee: number;
  grandTotal: number;
  totalAdvance: number;
  totalBalance: number;
}

export class PricingEngine {
  /**
   * Main calculation entry point for multi-vendor checkout
   */
  static async calculateMultiItemPrice(
    items: PricingItem[],
    couponCode?: string,
    tx?: Prisma.TransactionClient
  ): Promise<MultiItemPricing> {
    const start = performance.now();
    console.log(`[PricingEngine] [1] calculateMultiItemPrice start. Items: ${items?.length}`);
    const db = tx || prisma;
    const pricingItems: any[] = [];

    // 1. Optimized: Fetch all packages with their rules and addons in a single query
    const dbStart = performance.now();
    const packageIds = items.map(item => item.packageId).filter(Boolean);

    if (packageIds.length === 0) {
        console.error("[PricingEngine] No package IDs provided for calculation");
        throw new Error("No packages selected for pricing.");
    }

    console.log(`[PricingEngine] [2] Fetching packages: ${packageIds.join(', ')}`);
    const packages = await db.renamedpackage.findMany({
      where: { id: { in: packageIds } },
      include: {
        pricingrule: true,
        package_addon: {
          where: { isActive: true }
        },
        service: {
          select: {
            vendorProfileId: true,
            title: true
          }
        }
      }
    });
    const dbEnd = performance.now();
    console.log(`[PricingEngine] [2] DB Fetch for ${packages.length} packages: ${(dbEnd - dbStart).toFixed(2)}ms`);

    const packageMap = new Map(packages.map(p => [p.id, p]));

    // 2. Calculate Individual Item Subtotals
    for (const item of items) {
      const calcItemStart = performance.now();
      const pkg = packageMap.get(item.packageId);
      if (!pkg) {
          console.error(`[PricingEngine] Package not found in map: ${item.packageId}`);
          throw new Error(`Package ${item.packageId} not found`);
      }

      console.log(`[PricingEngine] [3] Calculating single item for pkg: ${item.packageId}`);
      const breakdown = await this.calculateSingleItem(pkg, item.guestCount, item.addonIds);
      pricingItems.push({
        packageId: item.packageId,
        vendorId: pkg.service.vendorProfileId,
        details: {
          packageName: pkg.name,
          serviceTitle: pkg.service.title,
          addons: (pkg.package_addon as any[]).filter(a => item.addonIds?.includes(a.id)).map((a: any) => ({ id: a.id, name: a.name, price: Number(a.price) }))
        },
        breakdown
      });
      console.log(`[PricingEngine] [3] Single Item Calc | Pkg: ${item.packageId} | Time: ${(performance.now() - calcItemStart).toFixed(2)}ms`);
    }

    // 2. Aggregate Totals
    const totalPackageAmount = pricingItems.reduce((sum, item) => sum + item.breakdown.packageAmount + item.breakdown.guestScaling, 0);
    const totalAddonAmount = pricingItems.reduce((sum, item) => sum + item.breakdown.addonAmount, 0);
    const totalSubtotal = pricingItems.reduce((sum, item) => sum + item.breakdown.subtotal, 0);
    const totalVendorDiscount = pricingItems.reduce((sum, item) => sum + item.breakdown.vendorDiscount, 0);

    // 3. Platform Discounts (TBD Logic)
    const totalPlatformDiscount = 0;

    // 4. Coupon Calculation (Applied on taxable subtotal)
    let totalCouponDiscount = 0;
    if (couponCode) {
      const couponStart = performance.now();
      console.log(`[PricingEngine] [4] Checking coupon: ${couponCode}`);
      const coupon = await db.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive && new Date() < coupon.expiryDate) {
         if (coupon.discountType === "PERCENTAGE") {
            totalCouponDiscount = (totalSubtotal * Number(coupon.discountValue)) / 100;
         } else {
            totalCouponDiscount = Number(coupon.discountValue);
         }

         if (coupon.maxDiscount) {
            totalCouponDiscount = Math.min(totalCouponDiscount, Number(coupon.maxDiscount));
         }
      }
      console.log(`[PricingEngine] [4] Coupon Calc | Time: ${(performance.now() - couponStart).toFixed(2)}ms`);
    }

    // 5. Final Taxes & Fees (Aggregated at Order level)
    const totalTaxableAmount = totalSubtotal - totalVendorDiscount - totalPlatformDiscount - totalCouponDiscount;
    const totalGst = (totalTaxableAmount * BUSINESS_CONFIG.GST_PERCENTAGE) / 100;
    const totalPlatformFee = (totalTaxableAmount * BUSINESS_CONFIG.PLATFORM_FEE_PERCENTAGE) / 100;

    const grandTotal = totalTaxableAmount + totalGst + totalPlatformFee;
    const totalAdvance = grandTotal * 0.30;
    const totalBalance = grandTotal - totalAdvance;

    // 6. Redistribute GST/Fee proportionally to items for reporting (Optional but precise)
    pricingItems.forEach(item => {
        if (totalSubtotal > 0) {
            const proportion = item.breakdown.subtotal / totalSubtotal;
            item.breakdown.gstAmount = totalGst * proportion;
            item.breakdown.platformFee = totalPlatformFee * proportion;
            item.breakdown.totalAmount = item.breakdown.subtotal + item.breakdown.gstAmount + item.breakdown.platformFee;
        } else {
            item.breakdown.gstAmount = 0;
            item.breakdown.platformFee = 0;
            item.breakdown.totalAmount = item.breakdown.subtotal;
        }
    });

    console.log(`[PricingEngine] [END] calculateMultiItemPrice finished in ${(performance.now() - start).toFixed(2)}ms`);
    return {
      items: pricingItems,
      totalPackageAmount,
      totalAddonAmount,
      totalSubtotal,
      totalVendorDiscount,
      totalPlatformDiscount,
      totalCouponDiscount,
      totalGst,
      totalPlatformFee,
      grandTotal,
      totalAdvance,
      totalBalance
    };
  }

  private static async calculateSingleItem(pkg: any, guestCount: number, addonIds: string[]): Promise<PricingBreakdown> {
    const packageAmount = Number(pkg.price);

    // Guest scaling rule
    const rule = (pkg.pricingrule as any[]).find(r =>
      guestCount >= r.minGuests && guestCount <= r.maxGuests
    );
    const guestScaling = rule ? (Number(rule.pricePerGuest) * guestCount) + Number(rule.flatFee) : 0;

    // Addons (Enforced selection filter)
    const activeAddons = (pkg.package_addon as any[]).filter(a =>
        a.isActive && (addonIds || []).includes(a.id)
    );
    const addonAmount = activeAddons.reduce((sum: number, a: any) => sum + Number(a.price), 0);

    const subtotal = packageAmount + guestScaling + addonAmount;

    // Vendor specific discounts (Fetch from vendor settings if exists)
    const vendorDiscount = 0;

    return {
      packageAmount,
      guestScaling,
      addonAmount,
      subtotal,
      vendorDiscount,
      platformDiscount: 0,
      couponDiscount: 0,
      taxableAmount: subtotal - vendorDiscount,
      gstAmount: 0, // Injected at multi-item level
      platformFee: 0, // Injected at multi-item level
      totalAmount: subtotal - vendorDiscount,
      advanceAmount: 0,
      balanceAmount: 0
    };
  }
}
