import { inngest } from "@/lib/inngest";
import { FinanceService } from "@/services/server";
import { prisma } from "@/lib/prisma";

export const dailyVendorSettlement = inngest.createFunction(
  { id: "daily-vendor-settlement", triggers: [{ cron: "0 2 * * *" }] }, // Daily at 2 AM
  async ({ step }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfDay = new Date(yesterday);
    endOfDay.setHours(23, 59, 59, 999);

    const activeVendors = (await step.run("get-active-vendors", async () => {
      return prisma.vendorprofile.findMany({
        where: { booking: { some: { status: "EVENT_COMPLETED", updatedAt: { gte: yesterday, lte: endOfDay } } } },
        select: { id: true }
      });
    })) as any[];

    for (const vendor of activeVendors) {
      await step.run(`settle-${vendor.id}`, async () => {
        await FinanceService.generateSettlement(vendor.id, yesterday, endOfDay);
      });
    }
  }
);

export const aggregateFinanceBI = inngest.createFunction(
    { id: "aggregate-finance-bi", triggers: [{ cron: "0 * * * *" }] }, // Every hour
    async ({ step }) => {
        await step.run("refresh-executive-summary", async () => {
            await FinanceService.getExecutiveSummary();
        });

        // Hourly Revenue Growth
        await step.run("calculate-hourly-growth", async () => {
            // Logic for growth calculation and storing in Redis for fast charts
        });
    }
);

export const processRefundJob = inngest.createFunction(
    { id: "process-refund-job", triggers: [{ event: "finance/refund.requested" }] },
    async ({ event, step }) => {
        const { bookingId, amount, reason } = event.data;

        await step.run("detect-fraud", async () => {
            const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
            if (booking) {
                await FinanceService.detectAnomalies(booking.customerId, "REFUND_REQUEST", { amount });
            }
        });

        // Actual refund processing logic (Gateway integration)
        await step.run("execute-refund", async () => {
            const { processRefund } = await import("@/lib/payments");
            // This normally comes from a webhook, but if triggered manually/via job:
            // We'll mock the razorpay-like structure for the internal processor
            await processRefund({
                id: `rfnd_${crypto.randomUUID()}`,
                payment_id: event.data.paymentId, // Ensure this is passed in event.data
                amount: amount * 100, // Convert to paise
                status: "processed"
            });
        });

        await step.run("send-refund-notification", async () => {
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: { user: true }
            });
            if (booking && booking.user.email) {
                const { sendRefundEmail } = await import("@/lib/mail/resend");
                await sendRefundEmail(booking.user.email, {
                    customerName: booking.user.fullName,
                    bookingNumber: booking.bookingNumber,
                    amount: amount.toString(),
                    reason: reason || "Standard Refund"
                });
            }
        });
    }
);
