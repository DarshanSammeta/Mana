import { RAZORPAY_CONFIG } from "@/config/razorpay";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { processSuccessfulPayment, processRefund } from "@/lib/payments";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import crypto from "crypto";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = RAZORPAY_CONFIG.webhookSecret;

    if (!signature || !webhookSecret) {
      logger.warn("[Webhook] Signature or Secret missing");
      return NextResponse.json({ message: "Signature or Secret missing" }, { status: 400 });
    }

    // 1. Verify Signature
    const isValid = verifyWebhookSignature(body, signature, webhookSecret);
    if (!isValid) {
      logger.error("[Webhook] Invalid signature");
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventId = event.id;

    // 2. Idempotency Check
    const existingEvent = await prisma.webhookevent.findUnique({
      where: { eventId }
    });

    if (existingEvent?.processed) {
      logger.info(`[Webhook] Event ${eventId} already processed. Skipping.`);
      return NextResponse.json({ message: "Event already processed" });
    }

    logger.info(`[Webhook] Processing event: ${event.event} (${eventId})`);

    // Create or get the event record
    await prisma.webhookevent.upsert({
      where: { eventId },
      update: {},
      create: {
        id: crypto.randomUUID(),
        eventId,
        source: "RAZORPAY",
        type: event.event,
        payload: event
      }
    });

    // 3. Handle Events
    switch (event.event) {
      case "payment.captured":
        await processSuccessfulPayment(event.payload.payment.entity);
        break;
      case "refund.processed":
        await processRefund(event.payload.refund.entity);
        break;
      default:
        logger.info(`[Webhook] Unhandled event type: ${event.event}`);
    }

    // Mark event as processed
    await prisma.webhookevent.update({
      where: { eventId },
      data: { processed: true }
    });

    return NextResponse.json({ message: "Webhook processed" });
  });
}
