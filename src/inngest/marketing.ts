import { inngest } from "@/lib/inngest";
import { MarketingService } from "@/services/server";
import { prisma } from "@/lib/prisma";

export const processScheduledCampaign = inngest.createFunction(
  { id: "process-scheduled-campaign", triggers: [{ event: "marketing/campaign.scheduled" }] },
  async ({ event, step }) => {
    const campaignId = event.data.campaignId;

    const campaign = await step.run("get-campaign", async () => {
      return prisma.marketing_campaign.findUnique({
        where: { id: campaignId },
        include: { segment: true }
      });
    }) as any;

    if (!campaign || campaign.status !== "SCHEDULED") return;

    await step.run("activate-campaign", async () => {
      await prisma.marketing_campaign.update({
        where: { id: campaignId },
        data: { status: "ACTIVE" }
      });
    });

    // Segment processing and notification sending
    const users = await step.run("get-segment-users", async () => {
      if (!campaign.targetSegmentId) {
        // Broad campaign - maybe restricted by city/category
        const filters: any = {};
        if (campaign.city) filters.city = campaign.city;
        return prisma.user.findMany({
            where: filters,
            select: { id: true, email: true, mobileNumber: true }
        });
      }
      // Complex segment logic would go here
      return [];
    }) as any[];

    for (const user of users) {
      if (campaign.pushEnabled) {
        await step.run(`send-push-${user.id}`, async () => {
          await MarketingService.sendPushNotification(user.id, campaign.title, campaign.message);
        });
      }
      // Repeat for email, whatsapp, etc.
    }
  }
);

export const aggregateMarketingAnalytics = inngest.createFunction(
  { id: "aggregate-marketing-analytics", triggers: [{ cron: "0 0 * * *" }] }, // Daily at midnight
  async ({ step }) => {
    const campaigns = await step.run("get-active-campaigns", async () => {
        return prisma.marketing_campaign.findMany({
            where: { status: "ACTIVE" }
        });
    }) as any[];

    for (const campaign of campaigns) {
        await step.run(`update-campaign-stats-${campaign.id}`, async () => {
            // Recalculate revenue from converted bookings
            const revenue = await prisma.booking.aggregate({
                where: {
                    coupon: { campaignId: campaign.id },
                    status: "CONFIRMED"
                },
                _sum: { totalAmount: true }
            });

            await prisma.marketing_campaign.update({
                where: { id: campaign.id },
                data: { revenue: revenue._sum.totalAmount || 0 }
            });
        });
    }
  }
);

export const updateCRMDataJob = inngest.createFunction(
    { id: "update-crm-data-job", triggers: [{ event: "booking/completed" }] }, // Triggered when a booking is finished
    async ({ event, step }) => {
        await step.run("update-crm", async () => {
            await MarketingService.updateCustomerCRM(event.data.customerId);
        });
        await step.run("update-vendor-crm", async () => {
            await MarketingService.updateVendorCRM(event.data.vendorId);
        });
    }
);
