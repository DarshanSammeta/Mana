import { prisma } from "./prisma";
import { Decimal } from "@prisma/client/runtime/library";
import crypto from "crypto";
import { emitSocketEvent } from "./socket-helper";
import logger from "./logger";
import { NotificationTriggers } from "./notifications";

import { SOCKET_EVENTS } from "@/constants/socket-events";

import { booking_status, payment_status, transaction_status, transaction_type, wallet_type } from "@prisma/client";

export async function processSuccessfulPayment(payment: any) {
  const bookingId = payment.notes.bookingId;
  const paymentType = payment.notes.paymentType || "FULL";
  const razorpayPaymentId = payment.id;

  logger.info(`[PaymentService] Processing success for booking ${bookingId}, type ${paymentType}, payment ${razorpayPaymentId}`);

  // 1. Idempotency Check
  const existingPayment = await prisma.payment.findUnique({
    where: { razorpayPaymentId }
  });

  if (existingPayment?.status === payment_status.SUCCESS) {
    logger.info(`[PaymentService] Payment ${razorpayPaymentId} already processed.`);
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    // 2. Determine New Status & Milestone Data
    let newStatus: booking_status = booking_status.CONFIRMED;
    const milestoneData: any = {};

    if (paymentType === "ADVANCE") {
      newStatus = booking_status.ADVANCE_PAID;
      milestoneData.advancePaidAt = new Date();
      milestoneData.paymentStage = "ADVANCE_PAID";
    } else if (paymentType === "BALANCE") {
      newStatus = booking_status.FULLY_PAID;
      milestoneData.balancePaidAt = new Date();
      milestoneData.paymentStage = "FULLY_PAID";
    } else {
      newStatus = booking_status.CONFIRMED;
      milestoneData.advancePaidAt = new Date();
      milestoneData.balancePaidAt = new Date();
      milestoneData.paymentStage = "FULLY_PAID";
    }

    // 3. Update Booking via State Machine
    const { TimelineService } = await import("@/services/server/timeline.service");
    await TimelineService.transitionStatus(
      bookingId,
      newStatus,
      { id: "SYSTEM", name: "Razorpay", role: "ADMIN" },
      `Payment (${paymentType}) successful. Razorpay ID: ${razorpayPaymentId}`,
      tx
    );

    // Sync Milestone Data (since state machine only updates status)
    const booking = await tx.booking.update({
        where: { id: bookingId },
        data: milestoneData,
        include: { vendorprofile: true }
    });

    // 4. Upsert Payment Record
    const paymentRecord = await tx.payment.upsert({
      where: { razorpayPaymentId },
      update: { status: payment_status.SUCCESS },
      create: {
        id: crypto.randomUUID(),
        bookingId,
        amount: new Decimal(payment.amount / 100),
        status: payment_status.SUCCESS,
        paymentType: paymentType,
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

    if (!booking.vendorId) {
        throw new Error("Vendor not assigned to booking");
    }

    await tx.payment_split.upsert({
      where: { paymentId: paymentRecord.id },
      update: { status: "SUCCESS", updatedAt: new Date() },
      create: {
        id: crypto.randomUUID(),
        paymentId: paymentRecord.id,
        bookingId: bookingId,
        vendorId: booking.vendorId,
        customerProfileId: booking.customerProfileId,
        totalAmount,
        adminShare,
        vendorShare,
        commissionRate,
        status: "SUCCESS",
        updatedAt: new Date()
      }
    });

    // 5. Update Wallets (Escrow)
    let platformWallet = await tx.wallet.findFirst({ where: { type: wallet_type.PLATFORM } });
    if (!platformWallet) {
      platformWallet = await tx.wallet.create({ data: { id: crypto.randomUUID(), type: wallet_type.PLATFORM, balance: totalAmount } });
    } else {
      await tx.wallet.update({ where: { id: platformWallet.id }, data: { balance: { increment: totalAmount } } });
    }

    // Platform Credit Transaction
    await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        walletId: platformWallet.id,
        amount: totalAmount,
        type: transaction_type.CREDIT,
        description: `Payment for booking ${booking.bookingNumber}`,
        bookingId: booking.id,
        reference: razorpayPaymentId
      }
    });

    if (!booking.vendorprofile) {
        throw new Error("Vendor profile not found for booking");
    }

    // Vendor Pending Balance
    let vendorWallet = await tx.wallet.findUnique({ where: { userId: booking.vendorprofile.userId } });
    if (!vendorWallet) {
      vendorWallet = await tx.wallet.create({
        data: { id: crypto.randomUUID(), userId: booking.vendorprofile.userId, balance: 0, pendingBalance: vendorShare, type: wallet_type.VENDOR }
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
        type: transaction_type.CREDIT,
        status: transaction_status.PENDING,
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

    // Get customer userId from profile
    const profile = await prisma.customerprofile.findUnique({
      where: { id: result.booking.customerProfileId },
      select: { userId: true }
    });

    if (profile) {
      emitSocketEvent(profile.userId, SOCKET_EVENTS.BOOKING_PAYMENT, {
        bookingId,
        bookingNumber: result.booking.bookingNumber,
        status: "SUCCESS"
      });
    }

    if (result.booking.vendorprofile) {
      emitSocketEvent(result.booking.vendorprofile.userId, SOCKET_EVENTS.BOOKING_CONFIRMED, {
        bookingId,
        bookingNumber: result.booking.bookingNumber
      });
    }
  } catch (err) {
    logger.error("Payment post-processing side effects failed", err);
  }
}

export async function handleFailedPayment(payment: any) {
    const bookingId = payment.notes?.bookingId;
    const razorpayPaymentId = payment.id;

    logger.warn(`[PaymentService] Payment failed for booking ${bookingId}, payment ${razorpayPaymentId}`);

    if (bookingId) {
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                bookingstatuslog: {
                    create: {
                        status: "PAYMENT_PENDING",
                        notes: `Payment failed. Razorpay ID: ${razorpayPaymentId}. Error: ${payment.error_description || 'Unknown error'}`
                    }
                }
            }
        });

        const profile = await prisma.customerprofile.findUnique({
            where: { id: payment.notes.customerProfileId || '' }, // Assuming it's in notes
            select: { userId: true }
        });

        if (profile) {
            emitSocketEvent(profile.userId, SOCKET_EVENTS.BOOKING_PAYMENT, {
                bookingId,
                status: "FAILED",
                error: payment.error_description || 'Payment was unsuccessful'
            });
        }
    }

    await prisma.payment.upsert({
        where: { razorpayPaymentId },
        update: { status: "FAILED" },
        create: {
            id: crypto.randomUUID(),
            bookingId: bookingId || null,
            amount: new Decimal(payment.amount / 100),
            status: "FAILED",
            razorpayOrderId: payment.order_id,
            razorpayPaymentId,
            method: payment.method,
            updatedAt: new Date()
        }
    });
}

export async function processRefund(refundData: any) {
    const razorpayRefundId = refundData.id;
    const paymentId = refundData.payment_id;

    const payment = await prisma.payment.findUnique({
        where: { razorpayPaymentId: paymentId },
        include: {
          booking: {
            include: {
              vendorprofile: true,
              customerprofile: { include: { user: true } }
            }
          }
        }
    });

    if (!payment || !payment.booking || !payment.booking.customerprofile) {
        logger.error(`[PaymentService] Payment ${paymentId} or associated booking/profile not found for refund ${razorpayRefundId}`);
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
                    create: { status: "CANCELLED", notes: `Refund processed: ${razorpayRefundId}` }
                }
            }
        });

        const amount = new Decimal(refundData.amount / 100);

        // Adjust Wallets
        const platformWallet = await tx.wallet.findFirst({ where: { type: "PLATFORM" } });
        if (platformWallet) {
            await tx.wallet.update({ where: { id: platformWallet.id }, data: { balance: { decrement: amount } } });
        }

        if (payment.booking.vendorprofile) {
            await tx.wallet.update({
                where: { userId: payment.booking.vendorprofile.userId },
                data: { pendingBalance: { decrement: payment.booking.vendorPayout } }
            });
        }

        const customerWallet = await tx.wallet.upsert({
            where: { userId: payment.booking.customerprofile.userId },
            update: { balance: { increment: amount } },
            create: { id: crypto.randomUUID(), userId: payment.booking.customerprofile.userId, balance: amount, type: "USER" }
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

    emitSocketEvent(payment.booking.customerprofile.userId, SOCKET_EVENTS.BOOKING_PAYMENT, {
        bookingId,
        type: 'REFUND',
        amount: refundData.amount / 100
    });
}
