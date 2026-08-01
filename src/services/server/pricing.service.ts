import { prisma as defaultPrisma } from "@/lib/prisma";
import { BUSINESS_CONFIG } from "@/constants/config";
import { Prisma } from "@prisma/client";

interface PricingParams {
  packageId: string;
  guestCount: number;
  addonIds?: string[];
}

export const pricingService = {
  async calculateBookingPrice({ packageId, guestCount, addonIds = [] }: PricingParams, tx?: Prisma.TransactionClient, preFetchedPkg?: any) {
    console.log("[DEBUG] [pricingService.calculateBookingPrice] Starting calculation", { packageId, guestCount, addonIds });
    const db = tx || defaultPrisma;
    // 1. Fetch Package with pricing rules and addons
    const pkg = preFetchedPkg || await db.renamedpackage.findUnique({
      where: { id: packageId },
      include: {
        pricingrule: true,
        package_addon: {
          where: { id: { in: addonIds }, isActive: true }
        }
      }
    });

    if (!pkg) {
        console.error("[DEBUG] [pricingService.calculateBookingPrice] Package NOT FOUND:", packageId);
        throw new Error("Package not found");
    }

    const basePrice = Number(pkg.price);
    console.log("[DEBUG] [pricingService.calculateBookingPrice] Package found:", pkg.name, "BasePrice:", basePrice);

    // 2. Calculate Guest Scaling
    const rule = (pkg.pricingrule as any[]).find((r: any) =>
      guestCount >= r.minGuests && guestCount <= r.maxGuests
    );

    if (!rule && pkg.pricingrule.length > 0) {
        console.warn("[DEBUG] [pricingService.calculateBookingPrice] NO PRICING RULE MATCHED for guestCount:", guestCount);
    }

    const pricePerGuest = rule ? Number(rule.pricePerGuest) : 0;
    const flatFee = rule ? Number(rule.flatFee) : 0;
    const guestTotal = pricePerGuest * guestCount;
    console.log("[DEBUG] [pricingService.calculateBookingPrice] Rule applied:", { pricePerGuest, flatFee, guestTotal });

    // 3. Calculate Addons
    const activeAddons = (pkg.package_addon as any[]).filter(a =>
      a.isActive && (addonIds.length === 0 || addonIds.includes(a.id))
    );
    const addonsTotal = activeAddons.reduce((sum: number, addon: any) => sum + Number(addon.price), 0);
    const addonsDetail = activeAddons.map((a: any) => ({
        id: a.id,
        name: a.name,
        price: Number(a.price)
    }));
    console.log("[DEBUG] [pricingService.calculateBookingPrice] Addons total:", addonsTotal);

    // 4. Totals
    const subtotal = basePrice + guestTotal + flatFee + addonsTotal;
    const platformFee = (subtotal * BUSINESS_CONFIG.PLATFORM_FEE_PERCENTAGE) / 100;
    const taxes = ((subtotal + platformFee) * BUSINESS_CONFIG.GST_PERCENTAGE) / 100;
    const total = subtotal + platformFee + taxes;

    // 5. Milestones
    const advanceAmount = total * 0.30;
    const balanceAmount = total - advanceAmount;

    console.log("[DEBUG] [pricingService.calculateBookingPrice] Final total:", total);

    return {
      basePrice,
      guestScaling: guestTotal + flatFee,
      addonsTotal,
      addonsDetail,
      subtotal,
      platformFee,
      taxes,
      total,
      advanceAmount,
      balanceAmount,
      breakdown: {
        base: basePrice,
        guests: guestTotal,
        extra: flatFee,
        addons: addonsTotal,
        platform: platformFee,
        tax: taxes,
        total: total
      }
    };
  },

  async validateHierarchy({ eventTypeId, categoryId, subcategoryId, serviceTypeId, packageId }: any) {
    console.log("[DEBUG] [pricingService.validateHierarchy] Checking:", { eventTypeId, categoryId, subcategoryId, serviceTypeId, packageId });
    const pkg = await defaultPrisma.renamedpackage.findUnique({
        where: { id: packageId },
        include: {
            pricingrule: true,
            package_addon: {
                where: { isActive: true }
            },
            service: {
                include: {
                    vendorprofile: true,
                    servicetype: {
                        include: {
                            subcategory: {
                                include: {
                                    category: {
                                        include: {
                                            eventtype: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!pkg) {
        console.log("[DEBUG] [pricingService.validateHierarchy] Package not found");
        return { valid: false, message: "Package not found" };
    }

    const service = pkg.service;
    const st = service.servicetype;
    const sub = st.subcategory;
    const cat = sub.category;

    console.log("[DEBUG] [pricingService.validateHierarchy] Found hierarchy:", {
        serviceId: service.id,
        serviceTypeId: st.id,
        subcategoryId: sub.id,
        categoryId: cat.id,
        eventTypeId: cat.eventTypeId
    });

    if (st.id !== serviceTypeId) {
        console.log("[DEBUG] [pricingService.validateHierarchy] Service Type mismatch. Expected:", serviceTypeId, "Actual:", st.id);
        return { valid: false, message: "Service Type mismatch" };
    }
    if (sub.id !== subcategoryId) {
        console.log("[DEBUG] [pricingService.validateHierarchy] Sub Category mismatch. Expected:", subcategoryId, "Actual:", sub.id);
        return { valid: false, message: "Sub Category mismatch" };
    }
    if (cat.id !== categoryId) {
        console.log("[DEBUG] [pricingService.validateHierarchy] Category mismatch. Expected:", categoryId, "Actual:", cat.id);
        return { valid: false, message: "Category mismatch" };
    }
    if (cat.eventTypeId !== eventTypeId) {
        console.log("[DEBUG] [pricingService.validateHierarchy] Event Type mismatch. Expected:", eventTypeId, "Actual:", cat.eventTypeId);
        return { valid: false, message: "Event Type mismatch" };
    }

    console.log("[DEBUG] [pricingService.validateHierarchy] Hierarchy is VALID");
    return { valid: true, pkg };
  },

  async calculateMultiItemPrice(items: any[], guestCount: number, tx?: Prisma.TransactionClient) {
    const db = tx || defaultPrisma;
    let totalSubtotal = 0;
    let totalPlatformFee = 0;
    let totalGst = 0;
    const itemDetails: any[] = [];

    const packageIds = items.map(i => i.packageId);

    // Optimized: Fetch all packages in one query
    const packages = await db.renamedpackage.findMany({
      where: { id: { in: packageIds } },
      include: {
        pricingrule: true,
        package_addon: true
      }
    });

    console.log("[PricingService] Calculating Optimized Multi-Item Price", { itemCount: items.length, guestCount });

    for (const item of items) {
      const pkg = packages.find(p => p.id === item.packageId);
      if (!pkg) throw new Error(`Package ${item.packageId} not found`);

      const pricing = await this.calculateBookingPrice({
        packageId: item.packageId,
        guestCount,
        addonIds: item.selectedAddonIds
      }, db, pkg);

      totalSubtotal += pricing.subtotal;
      totalPlatformFee += pricing.platformFee;
      totalGst += pricing.taxes;

      itemDetails.push({
        ...item,
        price: pricing.basePrice,
        breakdown: pricing
      });
    }

    const total = totalSubtotal + totalPlatformFee + totalGst;

    return {
      subtotal: totalSubtotal,
      platformFee: totalPlatformFee,
      totalGst: totalGst,
      total: total,
      advanceAmount: total * 0.30,
      balanceAmount: total * 0.70,
      items: itemDetails
    };
  }
};
