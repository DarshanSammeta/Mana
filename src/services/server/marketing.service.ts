import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("marketing.service can only be used on the server.");
}
import { safeRedis } from "@/lib/redis";
import { Inngest } from "inngest";
import { Decimal } from "@prisma/client/runtime/library";

const inngest = new Inngest({ id: "mana-marketing" });

export class MarketingService {
  private static CACHE_TTL = 3600; // 1 hour

  // --- Campaign Management ---

  static async createCampaign(data: {
    name: string;
    type: string;
    startDate: Date;
    endDate: Date;
    title: string;
    message: string;
    budget?: number;
    city?: string;
    categoryIds?: string[];
    vendorIds?: string[];
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    whatsappEnabled?: boolean;
    targetSegmentId?: string;
  }) {
    const prisma = getPrisma();
    const campaign = await prisma.marketing_campaign.create({
      data: {
        ...data,
        categoryIds: data.categoryIds ? JSON.stringify(data.categoryIds) : undefined,
        vendorIds: data.vendorIds ? JSON.stringify(data.vendorIds) : undefined,
      },
    });

    // Schedule campaign jobs if not draft
    if (campaign.status === "SCHEDULED") {
      await inngest.send({
        name: "marketing/campaign.scheduled",
        data: { campaignId: campaign.id },
      });
    }

    return campaign;
  }

  static async getCampaigns(filters: any) {
    const prisma = getPrisma();
    return prisma.marketing_campaign.findMany({
      where: filters,
      include: {
        segment: true,
        _count: {
          select: { analytics: true, coupons: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- CRM & Segmentation ---

  static async updateCustomerCRM(userId: string) {
    const prisma = getPrisma();
    const bookings = await prisma.booking.findMany({
      where: { customerId: userId },
      select: { totalAmount: true, createdAt: true, vendorId: true, bookingitem: { include: { service: true } } }
    });

    if (bookings.length === 0) return;

    const totalSpent = bookings.reduce((sum, b) => sum.plus(b.totalAmount), new Decimal(0));
    const avgSpend = totalSpent.div(bookings.length);
    const lastBooking = bookings[bookings.length - 1].createdAt;

    const categoryMap = new Map<string, number>();
    const vendorMap = new Map<string, number>();

    bookings.forEach(b => {
      if (b.vendorId) {
        vendorMap.set(b.vendorId, (vendorMap.get(b.vendorId) || 0) + 1);
      }
      b.bookingitem.forEach(item => {
        const catId = item.service.serviceTypeId;
        categoryMap.set(catId, (categoryMap.get(catId) || 0) + 1);
      });
    });

    const preferredCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);

    const preferredVendors = Array.from(vendorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);

    let lifecycleStage = "ACTIVE";
    if (totalSpent.gt(100000)) lifecycleStage = "VIP";
    if (Date.now() - lastBooking.getTime() > 90 * 24 * 60 * 60 * 1000) lifecycleStage = "INACTIVE";

    return prisma.customer_crm_data.upsert({
      where: { userId },
      update: {
        lifecycleStage,
        bookingFrequency: bookings.length / ( (Date.now() - bookings[0].createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30) || 1 ),
        lifetimeValue: totalSpent,
        averageSpend: avgSpend,
        lastBookingDate: lastBooking,
        preferredCategories,
        preferredVendors
      },
      create: {
        userId,
        lifecycleStage,
        lifetimeValue: totalSpent,
        averageSpend: avgSpend,
        preferredCategories,
        preferredVendors
      }
    });
  }

  static async updateVendorCRM(vendorId: string) {
    const prisma = getPrisma();
    const vendor = await prisma.vendorprofile.findUnique({
      where: { id: vendorId },
      include: {
        booking: { where: { status: "EVENT_COMPLETED" } },
        review: true
      }
    });

    if (!vendor) return;

    const completedBookings = vendor.booking.length;
    const totalRevenue = vendor.booking.reduce((sum, b) => sum.plus(b.totalAmount), new Decimal(0));

    // Quality Score calculation based on ratings and completion rate
    const qualityScore = (vendor.rating * 10) + (vendor.completionRate * 0.5);

    // Ranking Score (simplified)
    const rankingScore = qualityScore + (completedBookings * 2);

    return prisma.vendor_crm_data.upsert({
      where: { vendorId },
      update: {
        growthRate: 0, // Would need historical comparison
        qualityScore,
        rankingScore,
        revenueYTD: totalRevenue,
      },
      create: {
        vendorId,
        qualityScore,
        rankingScore,
        revenueYTD: totalRevenue,
      }
    });
  }

  static async createSegment(name: string, filters: any) {
    const prisma = getPrisma();
    // Basic implementation - in a real world this would use complex JSON query builders
    return prisma.customer_segment.create({
      data: { name, filters }
    });
  }

  // --- Automation Engines ---

  static async sendPushNotification(userId: string, title: string, body: string, metadata?: any) {
    // Integration with existing NotificationService
    // Placeholder for direct push service (FCM)
    await inngest.send({
      name: "notification/push.send",
      data: { userId, title, body, metadata }
    });
  }

  static async sendEmailAutomation(userId: string, templateName: string, variables: any) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await inngest.send({
      name: "email/automation.send",
      data: { email: user.email, templateName, variables }
    });
  }

  static async sendWhatsAppAutomation(userId: string, templateName: string, variables: any) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mobileNumber) return;

    await inngest.send({
      name: "whatsapp/automation.send",
      data: { phone: user.mobileNumber, templateName, variables }
    });
  }

  // --- Coupon Engine Enhancement ---

  static async generateDynamicCoupon(data: {
    userId: string;
    campaignId?: string;
    discountType: "FLAT" | "PERCENTAGE";
    discountValue: number;
    expiryDays: number;
  }) {
    const prisma = getPrisma();
    const code = `PROMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + data.expiryDays);

    return prisma.coupon.create({
      data: {
        code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        expiryDate,
        campaignId: data.campaignId,
        isActive: true,
        usageLimit: 1
      }
    });
  }

  // --- Analytics & ROI ---

  static async trackMarketingEvent(data: {
    campaignId?: string;
    userId?: string;
    eventType: string;
    source?: string;
    metadata?: any;
  }) {
    const prisma = getPrisma();
    const event = await prisma.marketing_analytics.create({ data });

    if (data.campaignId) {
      const field = data.eventType === "VIEW" ? "impressions" :
                    data.eventType === "CLICK" ? "clicks" :
                    data.eventType === "CONVERSION" ? "conversions" : null;

      if (field) {
        await prisma.marketing_campaign.update({
          where: { id: data.campaignId },
          data: { [field]: { increment: 1 } }
        });
      }
    }

    return event;
  }

  // --- SEO & Sharing ---

  static async getSEOMetadata(path: string) {
    const cached = await safeRedis.get(`seo:${path}`);
    if (cached) return cached;

    const prisma = getPrisma();
    const metadata = await prisma.seo_metadata.findUnique({ where: { path } });
    if (metadata) {
      await safeRedis.set(`seo:${path}`, metadata, 3600);
    }
    return metadata;
  }
}
