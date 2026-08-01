import "server-only";
import { getPrisma } from "@/lib/prisma";
import { safeRedis } from "@/lib/redis";
import { Decimal } from "@prisma/client/runtime/library";
import { wallet_type } from "@prisma/client";
import crypto from "crypto";
import logger from "@/lib/logger";

if (typeof window !== "undefined") {
  throw new Error("FinanceService can only be used on the server.");
}

export class FinanceService {
  private static CACHE_TTL = 300; // 5 minutes for BI data

  // --- Commission Engine ---

  static async calculateCommission(bookingId: string) {
    const prisma = getPrisma();
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vendorprofile: true, bookingitem: { include: { service: true } } }
    });

    if (!booking) throw new Error("Booking not found");

    // 1. Get Rules (Priority ordered)
    const commissionRules = await prisma.commission_rule.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" }
    });

    let rate = new Decimal(10); // Default global rate

    // Matching logic
    const vendorRule = commissionRules.find(r => r.type === "VENDOR" && r.targetId === booking.vendorId);
    if (vendorRule) {
      rate = vendorRule.rate;
    } else {
      const globalRule = commissionRules.find(r => r.type === "GLOBAL");
      if (globalRule) rate = globalRule.rate;
    }

    const commissionAmount = booking.totalAmount.mul(rate).div(100);
    return { rate, amount: commissionAmount };
  }

  // --- Wallet & Transactions ---

  static async transferFunds(
    from: { userId?: string; type?: wallet_type },
    to: { userId?: string; type?: wallet_type },
    amount: Decimal,
    metadata: { description: string; reference?: string; bookingId?: string }
  ) {
    const prisma = getPrisma();

    if (amount.lte(0)) {
        throw new Error("Transfer amount must be positive");
    }

    return await prisma.$transaction(async (tx) => {
      if (metadata.reference) {
          const existingTx = await tx.transaction.findFirst({
              where: { reference: metadata.reference }
          });
          if (existingTx) {
              logger.info(`[FinanceService] Skipping duplicate transfer. Reference: ${metadata.reference}`);
              return { status: "SKIPPED_DUPLICATE" };
          }
      }

      const source = await tx.wallet.findFirst({
        where: from.userId
            ? { userId: from.userId }
            : { type: from.type, userId: null }
      });

      if (!source) {
          throw new Error(`Source wallet not found: ${from.userId ? 'User '+from.userId : from.type}`);
      }

      if (source.balance.lt(amount)) {
          throw new Error(`Insufficient funds in source wallet. Available: ${source.balance}, Required: ${amount}`);
      }

      let destination = await tx.wallet.findFirst({
        where: to.userId
            ? { userId: to.userId }
            : { type: to.type, userId: null }
      });

      if (!destination && to.userId) {
          destination = await tx.wallet.create({
              data: {
                  id: crypto.randomUUID(),
                  userId: to.userId,
                  type: "USER",
                  balance: new Decimal(0)
              }
          });
      }

      if (!destination) {
          throw new Error(`Destination wallet not found: ${to.userId ? 'User '+to.userId : to.type}`);
      }

      const updatedSource = await tx.wallet.update({
        where: { id: source.id },
        data: {
            balance: { decrement: amount },
            ...(from.userId ? { lifetimeSpending: { increment: amount } } : {})
        }
      });

      const updatedDest = await tx.wallet.update({
        where: { id: destination.id },
        data: {
            balance: { increment: amount },
            ...(to.userId ? { lifetimeEarnings: { increment: amount } } : {})
        }
      });

      const commonData: any = {
          status: "COMPLETED",
          description: metadata.description,
          reference: metadata.reference,
          bookingId: metadata.bookingId,
          createdAt: new Date()
      };

      await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          walletId: source.id,
          amount: amount.negated(),
          type: "DEBIT",
          ...commonData
        }
      });

      await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          walletId: destination.id,
          amount: amount,
          type: "CREDIT",
          ...commonData
        }
      });

      return { source: updatedSource, destination: updatedDest };
    });
  }

  static async getExecutiveSummary() {
    const cached = await safeRedis.get("bi:executive_summary");
    if (cached) return cached;

    const prisma = getPrisma();
    const stats = await prisma.$transaction([
      prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { status: "EVENT_COMPLETED" } }),
      prisma.booking.aggregate({ _sum: { commissionAmount: true }, where: { status: "EVENT_COMPLETED" } }),
      prisma.refund.aggregate({ _sum: { amount: true }, where: { status: "PROCESSED" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.vendorprofile.count()
    ]);

    const summary = {
        totalGTV: stats[0]._sum.totalAmount || 0,
        netRevenue: stats[1]._sum.commissionAmount || 0,
        refunds: stats[2]._sum.amount || 0,
        customerCount: stats[3],
        vendorCount: stats[4]
    };

    await safeRedis.set("bi:executive_summary", summary, this.CACHE_TTL);
    return summary;
  }

  static async generateSettlement(vendorId: string, startDate: Date, endDate: Date) {
    const prisma = getPrisma();

    const bookings = await prisma.booking.findMany({
        where: {
            vendorId,
            status: "EVENT_COMPLETED",
            updatedAt: { gte: startDate, lte: endDate }
        }
    });

    if (bookings.length === 0) return { status: "NO_BOOKINGS" };

    const totalGross = bookings.reduce((sum, b) => sum.plus(b.totalAmount), new Decimal(0));
    const totalCommission = bookings.reduce((sum, b) => sum.plus(b.commissionAmount), new Decimal(0));
    const netAmount = totalGross.minus(totalCommission);

    return await prisma.settlement.create({
        data: {
            id: crypto.randomUUID(),
            vendorId,
            amount: totalGross,
            commissionCharged: totalCommission,
            netAmount,
            periodStart: startDate,
            periodEnd: endDate,
            status: "PENDING",
            createdAt: new Date()
        }
    });
  }

  static async detectAnomalies(userId: string, action: string, _data: any) {
      const prisma = getPrisma();
      if (action === "REFUND_REQUEST") {
          // Fix: Updated where clause to use customerprofile relation
          const recentRefunds = await prisma.refund.count({
              where: {
                  booking: { customerprofile: { userId: userId } },
                  createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
              }
          });

          if (recentRefunds > 5) {
              await prisma.fraud_detection_log.create({
                  data: {
                      userId,
                      type: "REFUND_ABUSE",
                      severity: "HIGH",
                      description: "Excessive refund requests in last 30 days",
                      evidence: { count: recentRefunds }
                  }
              });
              return true;
          }
      }
      return false;
  }
}
