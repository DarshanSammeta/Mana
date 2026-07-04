import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { processSuccessfulPayment } from "@/lib/payments";
import logger from "@/lib/logger";

/**
 * Background job to reconcile payments that might have failed
 * or where the webhook was missed. Runs every hour.
 */
export const reconcilePayments = inngest.createFunction(
  { id: "reconcile-payments", triggers: [{ cron: "0 * * * *" }] }, // Every hour
  async ({ step }) => {
    const pendingPayments = await step.run("fetch-pending-payments", async () => {
      // Find payments created in the last 24 hours that are still PENDING
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return await prisma.payment.findMany({
        where: {
          status: "PENDING",
          createdAt: { gte: oneDayAgo },
          razorpayOrderId: { not: null }
        },
        take: 20 // Process in batches
      });
    });

    const results = [];
    for (const payment of pendingPayments) {
      const result = await step.run(`reconcile-${payment.id}`, async () => {
        try {
          const razorpay = getRazorpay();
          const orderId = payment.razorpayOrderId!;

          // Fetch payments for this order from Razorpay
          const rpPayments = await razorpay.orders.fetchPayments(orderId);
          const capturedPayment = rpPayments.items.find((p: any) => p.status === "captured");

          if (capturedPayment) {
            logger.info(`[Reconciliation] Found captured payment ${capturedPayment.id} for order ${orderId}`);
            // If notes are missing in RP payment (unlikely if we sent them),
            // we can reconstruct them or use the DB payment record
            capturedPayment.notes = capturedPayment.notes || {};
            capturedPayment.notes.bookingId = payment.bookingId;

            await processSuccessfulPayment(capturedPayment);
            return { paymentId: payment.id, status: "RECONCILED_SUCCESS" };
          } else {
            // Check if all attempts failed and it's old enough
            const isOld = new Date(payment.createdAt).getTime() < Date.now() - 30 * 60 * 1000;
            if (isOld) {
              await prisma.payment.update({
                where: { id: payment.id },
                data: { status: "FAILED" }
              });
              return { paymentId: payment.id, status: "MARKED_FAILED" };
            }
          }
        } catch (error: any) {
          logger.error(`[Reconciliation] Error reconciling payment ${payment.id}:`, error);
          return { paymentId: payment.id, status: "ERROR", message: error.message };
        }
        return { paymentId: payment.id, status: "STILL_PENDING" };
      });
      results.push(result);
    }

    return { reconciled: results.length, details: results };
  }
);

/**
 * Auto-release escrow after event completion + buffer
 */
export const releaseEscrowAfterEvent = inngest.createFunction(
  { id: "release-escrow-after-event", triggers: [{ event: "booking/confirmed" }] }, // Triggered when a booking is confirmed
  async ({ event, step }) => {
    const { bookingId, eventDate } = event.data;

    // Wait until 24 hours after the event date
    const releaseTime = new Date(eventDate);
    releaseTime.setHours(releaseTime.getHours() + 24);

    await step.sleepUntil("wait-for-event-completion", releaseTime);

    await step.run("release-funds", async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { vendorprofile: true }
      });

      if (booking?.status === "CONFIRMED") {
         // Real enterprise app would check for active disputes here
         const activeDispute = await prisma.dispute.findUnique({
           where: { bookingId }
         });

         if (activeDispute && activeDispute.status !== "RESOLVED") {
           logger.warn(`[Escrow] Skipping fund release for booking ${bookingId} due to active dispute`);
           return { status: "DISPUTED" };
         }

         await prisma.$transaction(async (tx) => {
            const vendorWallet = await tx.wallet.findUnique({
              where: { userId: booking.vendorprofile.userId }
            });

            if (vendorWallet) {
               // Move from pending to balance
               await tx.wallet.update({
                 where: { id: vendorWallet.id },
                 data: {
                   pendingBalance: { decrement: booking.vendorPayout },
                   balance: { increment: booking.vendorPayout },
                   withdrawable: { increment: booking.vendorPayout }
                 }
               });

               // Mark transaction as COMPLETED
               await tx.transaction.updateMany({
                 where: { bookingId: booking.id, walletId: vendorWallet.id, type: "CREDIT" },
                 data: { status: "COMPLETED" }
               });
            }
         });
         return { status: "RELEASED" };
      }
      return { status: "SKIPPED", reason: "Booking status not CONFIRMED" };
    });
  }
);
