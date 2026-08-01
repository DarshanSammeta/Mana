import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("marketing.service can only be used on the server.");
}
// import { safeRedis } from "@/lib/redis";
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

    // Fix: Resolve profileId first
    const profile = await prisma.customerprofile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!profile) return;

    // Fix: Query bookings via customerProfileId
    const bookings = await prisma.booking.findMany({
      where: { customerProfileId: profile.id },
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

    // Fix: Upsert using customerProfileId instead of dropped userId
    return prisma.customer_crm_data.upsert({
      where: { customerProfileId: profile.id },
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
        customerProfileId: profile.id,
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

    const bookings = await prisma.booking.findMany({
      where: { vendorId, status: "EVENT_COMPLETED" },
      select: { totalAmount: true, createdAt: true }
    });

    if (bookings.length === 0) return;

    const totalRevenue = bookings.reduce((sum, b) => sum.plus(b.totalAmount), new Decimal(0));

    return prisma.vendor_crm_data.upsert({
      where: { vendorId },
      update: {
        revenueYTD: totalRevenue,
        updatedAt: new Date()
      },
      create: {
        vendorId,
        revenueYTD: totalRevenue
      }
    });
  }

  // ... (Vendor CRM logic is correct as it uses vendorId)

  static async sendPushNotification(userId: string, title: string, body: string, metadata?: any) {
    await inngest.send({
      name: "notification/push.send",
      data: { userId, title, body, metadata }
    });
  }

  static async sendEmailAutomation(userId: string, templateName: string, variables: any) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) return;

    await inngest.send({
      name: "email/automation.send",
      data: { email: user.email, templateName, variables }
    });
  }

  // --- Analytics & ROI ---

  static async trackMarketingEvent(data: {
    campaignId?: string;
    customerProfileId?: string;
    userId?: string; // Legacy support
    eventType: string;
    source?: string;
    metadata?: any;
  }) {
    const prisma = getPrisma();

    // Fix: Ensure we use customerProfileId
    let profileId = data.customerProfileId;
    if (!profileId && data.userId) {
        const profile = await prisma.customerprofile.findUnique({
            where: { userId: data.userId },
            select: { id: true }
        });
        profileId = profile?.id;
    }

    const event = await prisma.marketing_analytics.create({
        data: {
            campaignId: data.campaignId,
            customerProfileId: profileId,
            eventType: data.eventType,
            source: data.source,
            metadata: data.metadata
        }
    });

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
}
