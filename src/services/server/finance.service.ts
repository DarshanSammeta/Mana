import "server-only";
import { getPrisma } from "@/lib/prisma";
import { safeRedis } from "@/lib/redis";
import { Decimal } from "@prisma/client/runtime/library";

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
    const rules = await prisma.commission_rule.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" }
    });

    let rate = new Decimal(10); // Default global rate

    // Matching logic (Simplified for brevity)
    // In production, this would match vendor, category, campaign rules
    const vendorRule = rules.find(r => r.type === "VENDOR" && r.targetId === booking.vendorId);
    if (vendorRule) {
      rate = vendorRule.rate;
    } else {
      const globalRule = rules.find(r => r.type === "GLOBAL");
      if (globalRule) rate = globalRule.rate;
    }

    const commissionAmount = booking.totalAmount.mul(rate).div(100);
    return { rate, amount: commissionAmount };
  }

  // --- Wallet & Transactions ---

  static async transferFunds(fromWalletType: string, toWalletType: string, amount: Decimal, metadata: any) {
    const prisma = getPrisma();
    return await prisma.$transaction(async (tx) => {
      // 1. Debit Source
      const source = await tx.wallet.update({
        where: { userId: fromWalletType }, // Corrected: use userId if that's what's intended, or whatever the unique constraint is
        data: { balance: { decrement: amount } }
      });

      // 2. Credit Destination
      const dest = await tx.wallet.update({
        where: { userId: toWalletType }, // Corrected
        data: { balance: { increment: amount } }
      });

      // 3. Log Transaction
      await tx.transaction.create({
        data: {
          walletId: source.id,
          amount: amount.negated(),
          type: "DEBIT",
          description: metadata.description,
          reference: metadata.reference
        }
      });

      await tx.transaction.create({
        data: {
          walletId: dest.id,
          amount: amount,
          type: "CREDIT",
          description: metadata.description,
          reference: metadata.reference
        }
      });

      return { source, dest };
    });
  }

  // --- Settlement Engine ---

  static async generateSettlement(vendorId: string, startDate: Date, endDate: Date) {
    const prisma = getPrisma();
    const bookings = await prisma.booking.findMany({
      where: {
        vendorId,
        status: "EVENT_COMPLETED",
        updatedAt: { gte: startDate, lte: endDate },
        payment: { some: { status: "SUCCESS" } }
      }
    });

    if (bookings.length === 0) return null;

    const totalAmount = bookings.reduce((sum, b) => sum.plus(b.totalAmount), new Decimal(0));
    const commission = bookings.reduce((sum, b) => sum.plus(b.commissionAmount), new Decimal(0));
    const netAmount = totalAmount.minus(commission);

    return await prisma.settlement.create({
      data: {
        vendorId,
        amount: totalAmount,
        commissionCharged: commission,
        netAmount,
        periodStart: startDate,
        periodEnd: endDate,
        status: "PENDING"
      }
    });
  }

  // --- Business Intelligence ---

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
        vendorCount: stats[4],
        takeRate: stats[0]._sum.totalAmount ? (Number(stats[1]._sum.commissionAmount) / Number(stats[0]._sum.totalAmount)) * 100 : 0
    };

    await safeRedis.set("bi:executive_summary", summary, this.CACHE_TTL);
    return summary;
  }

  // --- Fraud Detection ---

  static async detectAnomalies(userId: string, action: string, _data: any) {
      const prisma = getPrisma();
      if (action === "REFUND_REQUEST") {
          const recentRefunds = await prisma.refund.count({
              where: {
                  booking: { customerId: userId },
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
