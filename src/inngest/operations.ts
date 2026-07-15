import { inngest } from "@/lib/inngest";
import { OperationsService } from "@/services/server";
import { prisma } from "@/lib/prisma";

export const checkSupportSLA = inngest.createFunction(
  { id: "check-support-sla", triggers: [{ cron: "*/30 * * * *" }] },
  async ({ step }) => {
    const breachedTickets = await step.run("get-breached-tickets", async () => {
      return prisma.support_ticket.findMany({
        where: {
          status: { in: ["OPEN", "WAITING", "IN_PROGRESS"] },
          slaDeadline: { lte: new Date() },
        },
      });
    }) as any[];

    for (const ticket of breachedTickets) {
      await step.run(`escalate-ticket-${ticket.id}`, async () => {
        await prisma.support_ticket.update({
          where: { id: ticket.id },
          data: {
            status: "ESCALATED",
            priority: "URGENT"
          },
        });
        // Send notification to admin
      });
    }
  }
);

export const updateQualityMetricsJob = inngest.createFunction(
  { id: "update-quality-metrics-job", triggers: [{ cron: "0 1 * * *" }] }, // Daily at 1 AM
  async ({ step }) => {
    const vendors = await step.run("get-all-vendors", async () => {
      return prisma.vendorprofile.findMany({ select: { id: true } });
    }) as any[];

    for (const vendor of vendors) {
      await step.run(`update-trust-score-${vendor.id}`, async () => {
        await OperationsService.updateTrustScore(vendor.id, "VENDOR");
      });
    }
  }
);

export const autoCancellationJob = inngest.createFunction(
    { id: "auto-cancellation-job", triggers: [{ cron: "*/15 * * * *" }] }, // Every 15 minutes
    async ({ step }) => {
        const pendingBookings = await step.run("get-unaccepted-bookings", async () => {
            const timeout = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours
            return prisma.booking.findMany({
                where: {
                    status: "PENDING",
                    createdAt: { lte: timeout }
                }
            });
        }) as any[];

        for (const booking of pendingBookings) {
            await step.run(`auto-cancel-${booking.id}`, async () => {
                await OperationsService.cancelBooking(booking.id, "SYSTEM", "Vendor did not accept in time");
            });
        }
    }
);

export const documentExpiryCheck = inngest.createFunction(
    { id: "document-expiry-check", triggers: [{ cron: "0 0 * * *" }] }, // Daily at midnight
    async ({ step: _step }) => {
        // Mock logic: find documents expiring in 7 days
        // In reality, vendordocument needs an expiryDate field
    }
);
