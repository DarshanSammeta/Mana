import { prisma } from "./prisma";
import { Decimal } from "@prisma/client/runtime/library";
import crypto from "crypto";
import { emitSocketEvent } from "./socket-helper";
import logger from "./logger";
import { NotificationTriggers } from "./notifications";

export async function processSuccessfulPayment(payment: any) {
  const bookingId = payment.notes.bookingId;
  const razorpayPaymentId = payment.id;

  logger.info(`[PaymentService] Processing success for booking ${bookingId}, payment ${razorpayPaymentId}`);

  // 1. Idempotency Check
  const existingPayment = await prisma.payment.findUnique({
    where: { razorpayPaymentId }
  });

  if (existingPayment?.status === "SUCCESS") {
    logger.info(`[PaymentService] Payment ${razorpayPaymentId} already processed.`);
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    // 2. Update Booking
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        bookingstatuslog: {
          create: {
            id: crypto.randomUUID(),
            status: "CONFIRMED",
            notes: `Payment successful. Razorpay ID: ${razorpayPaymentId}`
          }
        }
      },
      include: {
        user: true,
        vendorprofile: true
      }
    });

    // 3. Upsert Payment Record
    const paymentRecord = await tx.payment.upsert({
      where: { razorpayPaymentId },
      update: { status: "SUCCESS" },
      create: {
        id: crypto.randomUUID(),
        bookingId,
        amount: new Decimal(payment.amount / 100),
        status: "SUCCESS",
        razorpayOrderId: payment.order_id,
        razorpayPaymentId,
        method: payment.method,
        updatedAt: new Date()
      }
    });

    // 4. Calculate Split (Escrow)
    const totalAmount = new Decimal(payment.amount / 100);
    const settings = await tx.globalsettings.findUnique({ where: { key: "admin_commission_percentage" } });
    const commissionRate = settings ? new Decimal(settings.value) : (booking.commissionRate || new Decimal(10));

    const adminShare = totalAmount.mul(commissionRate).div(100);
    const vendorShare = totalAmount.sub(adminShare);

    await tx.payment_split.upsert({
      where: { paymentId: paymentRecord.id },
      update: { status: "SUCCESS", updatedAt: new Date() },
      create: {
        id: crypto.randomUUID(),
        paymentId: paymentRecord.id,
        bookingId: bookingId,
        vendorId: booking.vendorId,
        customerId: booking.customerId,
        totalAmount,
        adminShare,
        vendorShare,
        commissionRate,
        status: "SUCCESS",
        updatedAt: new Date()
      }
    });

    // 5. Update Wallets (Escrow)
    let platformWallet = await tx.wallet.findFirst({ where: { type: "PLATFORM" } });
    if (!platformWallet) {
      platformWallet = await tx.wallet.create({ data: { id: crypto.randomUUID(), type: "PLATFORM", balance: totalAmount } });
    } else {
      await tx.wallet.update({ where: { id: platformWallet.id }, data: { balance: { increment: totalAmount } } });
    }

    // Platform Credit Transaction
    await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        walletId: platformWallet.id,
        amount: totalAmount,
        type: "CREDIT",
        description: `Payment for booking ${booking.bookingNumber}`,
        bookingId: booking.id,
        reference: razorpayPaymentId
      }
    });

    // Vendor Pending Balance
    let vendorWallet = await tx.wallet.findUnique({ where: { userId: booking.vendorprofile.userId } });
    if (!vendorWallet) {
      vendorWallet = await tx.wallet.create({
        data: { id: crypto.randomUUID(), userId: booking.vendorprofile.userId, balance: 0, pendingBalance: vendorShare, type: "VENDOR" }
      });
    } else {
      await tx.wallet.update({ where: { id: vendorWallet.id }, data: { pendingBalance: { increment: vendorShare } } });
    }

    // Vendor Escrow Transaction
    await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        walletId: vendorWallet.id,
        amount: vendorShare,
        type: "CREDIT",
        status: "PENDING",
        description: `Escrow credit for booking ${booking.bookingNumber}`,
        bookingId: booking.id,
        reference: razorpayPaymentId
      }
    });

    // 6. Invoice Generation
    const existingInvoice = await tx.invoice.findUnique({ where: { bookingId } });
    if (!existingInvoice) {
      await tx.invoice.create({
        data: { id: crypto.randomUUID(), bookingId, invoiceNumber: `INV-${Date.now()}` }
      });
    }

    return { booking, vendorShare, adminShare, totalAmount, commissionRate };
  });

  // 7. Async Side Effects
  try {
    await NotificationTriggers.paymentSuccess(result.booking, result);

    emitSocketEvent(result.booking.customerId, 'payment:success', { bookingId, bookingNumber: result.booking.bookingNumber });
    emitSocketEvent(result.booking.vendorprofile.userId, 'booking:new', { bookingId, bookingNumber: result.booking.bookingNumber });
  } catch (err) {
    logger.error("Payment post-processing side effects failed", err);
  }
}

export async function processRefund(refundData: any) {
    const razorpayRefundId = refundData.id;
    const paymentId = refundData.payment_id;

    const payment = await prisma.payment.findUnique({
        where: { razorpayPaymentId: paymentId },
        include: { booking: { include: { vendorprofile: true, user: true } } }
    });

    if (!payment) {
        logger.error(`[PaymentService] Payment ${paymentId} not found for refund ${razorpayRefundId}`);
        return;
    }

    const bookingId = payment.bookingId;

    await prisma.$transaction(async (tx) => {
        // Update Refund Record
        await tx.refund.upsert({
            where: { bookingId },
            update: { status: "PROCESSED", processedAt: new Date() },
            create: {
                id: crypto.randomUUID(),
                bookingId,
                amount: new Decimal(refundData.amount / 100),
                status: "PROCESSED",
                processedAt: new Date()
            }
        });

        // Update Booking
        await tx.booking.update({
            where: { id: bookingId },
            data: {
                status: "CANCELLED",
                bookingstatuslog: {
                    create: { id: crypto.randomUUID(), status: "CANCELLED", notes: `Refund processed: ${razorpayRefundId}` }
                }
            }
        });

        const amount = new Decimal(refundData.amount / 100);

        // Adjust Wallets
        const platformWallet = await tx.wallet.findFirst({ where: { type: "PLATFORM" } });
        if (platformWallet) {
            await tx.wallet.update({ where: { id: platformWallet.id }, data: { balance: { decrement: amount } } });
        }

        await tx.wallet.update({
            where: { userId: payment.booking.vendorprofile.userId },
            data: { pendingBalance: { decrement: payment.booking.vendorPayout } }
        });

        const customerWallet = await tx.wallet.upsert({
            where: { userId: payment.booking.customerId },
            update: { balance: { increment: amount } },
            create: { id: crypto.randomUUID(), userId: payment.booking.customerId, balance: amount, type: "USER" }
        });

        await tx.transaction.create({
            data: {
                id: crypto.randomUUID(),
                walletId: customerWallet.id,
                amount,
                type: "REFUND",
                status: "COMPLETED",
                description: `Refund for booking ${payment.booking.bookingNumber}`,
                bookingId,
                reference: razorpayRefundId
            }
        });
    });

    emitSocketEvent(payment.booking.customerId, 'wallet:updated', { type: 'REFUND', amount: refundData.amount / 100 });
}
