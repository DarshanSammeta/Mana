import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Decimal } from "@prisma/client/runtime/library";
import { sendBookingConfirmationEmail } from "@/lib/mail/resend";
import { sendSMS } from "@/lib/sms/twilio";
import { emitSocketEvent } from "@/lib/socket-helper";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ message: "Signature or Secret missing" }, { status: 400 });
  }

  // 1. Verify Signature
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const eventId = event.id;

  try {
    // 2. Idempotency Check
    const existingEvent = await prisma.webhookevent.findUnique({
      where: { eventId }
    });

    if (existingEvent?.processed) {
      return NextResponse.json({ message: "Event already processed" });
    }

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
        await handlePaymentCaptured(event);
        break;
      case "payment.failed":
        await handlePaymentFailed(event);
        break;
      case "refund.created":
        await handleRefundCreated(event);
        break;
      case "refund.processed":
        await handleRefundProcessed(event);
        break;
      case "payout.processed":
        await handlePayoutProcessed(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    // Mark event as processed
    await prisma.webhookevent.update({
      where: { eventId },
      data: { processed: true }
    });

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

async function handlePaymentCaptured(event: any) {
  const payment = event.payload.payment.entity;
  const bookingId = payment.notes.bookingId;
  const userId = payment.notes.userId;
  const paymentType = payment.notes.type;

  if (paymentType === "SUBSCRIPTION") {
    await handleSubscriptionPayment(payment);
    return;
  }

  if (!bookingId) return;

  await prisma.$transaction(async (tx) => {
    // 1. Update Booking
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        bookingstatuslog: {
          create: {
            id: crypto.randomUUID(),
            status: "CONFIRMED",
            notes: `Payment captured. Razorpay ID: ${payment.id}`
          }
        }
      },
      include: {
        user: true,
        vendorprofile: true
      }
    });

    // 2. Update Payment Record
    const paymentRecord = await tx.payment.upsert({
      where: { razorpayPaymentId: payment.id },
      update: { status: "SUCCESS" },
      create: {
        id: crypto.randomUUID(),
        bookingId,
        amount: new Decimal(payment.amount / 100),
        status: "SUCCESS",
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        method: payment.method,
        updatedAt: new Date()
      }
    });

    // 2.1 Calculate and Store Payment Split
    const totalAmount = new Decimal(payment.amount / 100);

    // Get Commission Rate from Global Settings or fallback to booking/vendor rate
    const settings = await tx.globalsettings.findUnique({ where: { key: "admin_commission_percentage" } });
    const commissionRate = settings ? new Decimal(settings.value) : (booking.commissionRate || new Decimal(20));

    const adminShare = totalAmount.mul(commissionRate).div(100);
    const vendorShare = totalAmount.sub(adminShare);

    const split = await tx.payment_split.create({
      data: {
        id: crypto.randomUUID(),
        paymentId: paymentRecord.id,
        bookingId: bookingId,
        vendorId: booking.vendorId,
        customerId: booking.customerId,
        totalAmount: totalAmount,
        adminShare: adminShare,
        vendorShare: vendorShare,
        commissionRate: commissionRate,
        status: "SUCCESS",
        updatedAt: new Date()
      }
    });

    // 3. Create Invoice
    const invoiceNumber = `INV-${Date.now()}`;
    await tx.invoice.create({
      data: {
        id: crypto.randomUUID(),
        bookingId,
        invoiceNumber,
      }
    });

    // 4. Update Wallets (Escrow Flow)
    // Platform Wallet gets the full amount
    let platformWallet = await tx.wallet.findUnique({
      where: { id: "PLATFORM_WALLET_ID" }
    });
    if (!platformWallet) {
      platformWallet = await tx.wallet.create({
        data: {
          id: crypto.randomUUID(),
          type: "PLATFORM",
          balance: totalAmount
        }
      });
    } else {
      platformWallet = await tx.wallet.update({
        where: { id: platformWallet.id },
        data: { balance: { increment: totalAmount } }
      });
    }

    // Create Transaction for Platform
    await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        walletId: platformWallet.id,
        amount: totalAmount,
        type: "CREDIT",
        description: `Payment received for booking ${booking.bookingNumber}`,
        bookingId: booking.id,
        reference: payment.id
      }
    });

    // Vendor's Pending Balance (Escrow)
    let vendorWallet = await tx.wallet.findUnique({ where: { userId: booking.vendorprofile.userId } });
    if (!vendorWallet) {
      vendorWallet = await tx.wallet.create({
        data: {
          id: crypto.randomUUID(),
          userId: booking.vendorprofile.userId,
          balance: 0,
          pendingBalance: vendorShare,
          type: "VENDOR"
        }
      });
    } else {
      vendorWallet = await tx.wallet.update({
        where: { id: vendorWallet.id },
        data: { pendingBalance: { increment: vendorShare } }
      });
    }

    // Transaction for Vendor (Pending Credit)
    await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        walletId: vendorWallet.id,
        amount: vendorShare,
        type: "CREDIT",
        status: "PENDING",
        description: `Escrow credit for booking ${booking.bookingNumber} (Net of ${commissionRate}% commission)`,
        bookingId: booking.id,
        reference: payment.id
      }
    });

    // Customer lifetime spending
    await tx.wallet.upsert({
      where: { userId: booking.customerId },
      update: {
        lifetimeSpending: { increment: booking.totalAmount }
      },
      create: {
        id: crypto.randomUUID(),
        userId: booking.customerId,
        balance: 0,
        lifetimeSpending: booking.totalAmount,
        type: "USER"
      }
    });

    // 5. Audit Log
    await tx.auditlog.create({
      data: {
        id: crypto.randomUUID(),
        userId: booking.customerId,
        action: "PAYMENT_CAPTURED",
        details: {
          bookingId,
          paymentId: payment.id,
          amount: payment.amount / 100
        }
      }
    });

    // 6. Notifications (In-app)
    await tx.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: booking.customerId,
        title: "Payment Successful",
        message: `Your booking ${booking.bookingNumber} has been confirmed.`,
        type: "BOOKING_UPDATE",
        link: `/customer/bookings/${booking.id}`
      }
    });

    // 7. External Triggers (Emails/SMS)
    await sendBookingConfirmationEmail(booking.user.email, {
      customerName: booking.user.fullName,
      bookingNumber: booking.bookingNumber,
      eventName: booking.eventName || "Event",
      eventDate: booking.eventDate.toLocaleDateString('en-IN'),
      totalAmount: `₹${booking.totalAmount}`
    });

    await sendSMS(booking.user.mobileNumber, `Payment Successful! Your booking ${booking.bookingNumber} for ${booking.eventName} is confirmed.`);

    // 8. Real-time emit
    emitSocketEvent(booking.customerId, 'payment:success', {
      bookingId,
      bookingNumber: booking.bookingNumber,
      amount: totalAmount,
      status: 'CONFIRMED'
    });

    emitSocketEvent(booking.vendorprofile.userId, 'wallet:updated', {
      type: 'ESCROW_CREDIT',
      amount: vendorShare,
      bookingNumber: booking.bookingNumber,
      commission: adminShare,
      commissionRate: commissionRate
    });

    emitSocketEvent(booking.vendorprofile.userId, 'booking:new', {
      bookingId,
      bookingNumber: booking.bookingNumber,
      totalAmount: totalAmount
    });
  });
}

async function handlePaymentFailed(event: any) {
  const payment = event.payload.payment.entity;
  const bookingId = payment.notes.bookingId;
  const userId = payment.notes.userId;

  if (!bookingId) return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      bookingstatuslog: {
        create: {
          id: crypto.randomUUID(),
          status: "PENDING",
          notes: `Payment failed. Reason: ${payment.error_description || 'Unknown'}`
        }
      }
    }
  });

  await prisma.auditlog.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      action: "PAYMENT_FAILED",
      details: {
        bookingId,
        paymentId: payment.id,
        error: payment.error_description
      }
    }
  });

  // Notify customer
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    await sendSMS(user.mobileNumber, `Payment Failed for your Mana Events booking. Please try again or contact support.`);
    emitSocketEvent(userId, 'payment:failed', { bookingId, error: payment.error_description });
  }
}

async function handleRefundCreated(event: any) {
  const refund = event.payload.refund.entity;
  const paymentId = refund.payment_id;

  const payment = await prisma.payment.findUnique({
    where: { razorpayPaymentId: paymentId }
  });

  if (!payment) return;

  await prisma.refund.create({
    data: {
      id: crypto.randomUUID(),
      bookingId: payment.bookingId,
      amount: new Decimal(refund.amount / 100),
      reason: refund.notes?.reason || "Requested via Razorpay",
      status: "REQUESTED"
    }
  });
}

async function handleRefundProcessed(event: any) {
  const refund = event.payload.refund.entity;
  const paymentId = refund.payment_id;

  const payment = await prisma.payment.findUnique({
    where: { razorpayPaymentId: paymentId },
    include: { booking: { include: { user: true, vendorprofile: true } } }
  });

  if (!payment) return;

  await prisma.$transaction(async (tx) => {
    // 1. Update Refund Record
    await tx.refund.update({
      where: { bookingId: payment.bookingId },
      data: {
        status: "PROCESSED",
        processedAt: new Date()
      }
    });

    // 2. Update Booking
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: "CANCELLED",
        bookingstatuslog: {
          create: {
            id: crypto.randomUUID(),
            status: "CANCELLED",
            notes: "Booking cancelled due to refund processing."
          }
        }
      }
    });

    // 3. Adjust Wallets
    const amount = new Decimal(refund.amount / 100);

    // Platform Wallet Out
    const platformWallet = await tx.wallet.findFirst({
      where: { type: "PLATFORM" }
    });

    if (platformWallet) {
      await tx.wallet.update({
        where: { id: platformWallet.id },
        data: { balance: { decrement: amount } }
      });
    }

    // Vendor Pending Balance Out (assuming full refund)
    // We should be careful here to only subtract what was added
    await tx.wallet.update({
      where: { userId: payment.booking.vendorprofile.userId },
      data: { pendingBalance: { decrement: payment.booking.vendorPayout } }
    });

    // Credit Customer Wallet
    const customerWallet = await tx.wallet.upsert({
      where: { userId: payment.booking.customerId },
      update: {
        balance: { increment: amount }
      },
      create: {
        id: crypto.randomUUID(),
        userId: payment.booking.customerId,
        balance: amount,
        type: "USER"
      }
    });

    // 4. Create Transaction Record
    await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        walletId: customerWallet.id,
        amount: amount,
        type: "REFUND",
        status: "COMPLETED",
        description: `Refund processed for booking ${payment.booking.bookingNumber}`,
        bookingId: payment.bookingId,
        reference: refund.id
      }
    });

    // 5. Audit Log
    await tx.auditlog.create({
      data: {
        id: crypto.randomUUID(),
        userId: payment.booking.customerId,
        action: "REFUND_PROCESSED",
        details: {
          bookingId: payment.bookingId,
          amount: refund.amount / 100,
          refundId: refund.id
        }
      }
    });

    // 6. Notifications
    await sendSMS(payment.booking.user.mobileNumber, `Refund Successful! ₹${refund.amount / 100} has been credited to your Mana Wallet.`);

    emitSocketEvent(payment.booking.customerId, 'wallet:updated', {
      type: 'REFUND',
      amount: amount,
      bookingId: payment.bookingId
    });
  });
}

async function handlePayoutProcessed(event: any) {
  const payoutEvent = event.payload.payout.entity;
  const payoutId = payoutEvent.id;
  const vendorId = payoutEvent.notes?.vendorId; // Assuming we pass this in notes during payout creation

  if (!vendorId) return;

  await prisma.$transaction(async (tx) => {
    // 1. Update Payout Record
    await tx.payout.update({
      where: { reference: payoutId },
      data: {
        status: "RELEASED",
        processedAt: new Date()
      }
    });

    // 2. Adjust Vendor Wallet
    const amount = new Decimal(payoutEvent.amount / 100);
    const vendorProfile = await tx.vendorprofile.findUnique({
      where: { id: vendorId },
      include: { user: true }
    });

    if (vendorProfile) {
      const wallet = await tx.wallet.update({
        where: { userId: vendorProfile.userId },
        data: {
          pendingBalance: { decrement: amount },
          balance: { increment: amount }, // Or withdrawable if you use that field
          lifetimeEarnings: { increment: amount }
        }
      });

      // 3. Create Transaction Record
      await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          walletId: wallet.id,
          amount: amount,
          type: "PAYOUT",
          status: "COMPLETED",
          description: `Payout released to bank account`,
          reference: payoutId
        }
      });

      // 4. Notify Vendor
      await sendSMS(vendorProfile.user.mobileNumber, `Payout Released! ₹${amount} has been processed to your bank account.`);

      emitSocketEvent(vendorProfile.userId, 'wallet:updated', {
        type: 'PAYOUT',
        amount: amount,
        status: 'RELEASED'
      });
    }
  });
}

async function handleSubscriptionPayment(payment: any) {
  const vendorId = payment.notes.vendorId;
  const planId = payment.notes.planId;

  if (!vendorId || !planId) return;

  await prisma.$transaction(async (tx) => {
    const plan = await tx.subscriptionplan.findUnique({ where: { id: planId } });
    if (!plan) return;

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const subscription = await tx.vendorsubscription.upsert({
      where: { vendorProfileId: vendorId },
      update: {
        planId: plan.id,
        startDate: new Date(),
        endDate: endDate,
        status: "ACTIVE",
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        vendorProfileId: vendorId,
        planId: plan.id,
        startDate: new Date(),
        endDate: endDate,
        status: "ACTIVE",
        updatedAt: new Date(),
      }
    });

    await tx.subscriptionpayment.upsert({
      where: { razorpayPaymentId: payment.id },
      update: {
        status: "SUCCESS",
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        subscriptionId: subscription.id,
        amount: plan.price,
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        razorpaySignature: payment.signature || "",
        status: "SUCCESS",
        updatedAt: new Date()
      }
    });

    const vendor = await tx.vendorprofile.findUnique({
      where: { id: vendorId },
      include: { user: true }
    });

    if (vendor) {
      await tx.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: vendor.userId,
          title: "Subscription Activated",
          message: `Your ${plan.name} plan is now active until ${endDate.toLocaleDateString('en-IN')}.`,
          type: "SUBSCRIPTION_UPDATE",
          link: "/vendor/subscription"
        }
      });

      emitSocketEvent(vendor.userId, 'subscription:updated', {
        planName: plan.name,
        endDate: endDate,
        status: 'ACTIVE'
      });
    }
  });
}
