import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("LoyaltyService can only be used on the server.");
}
import logger from "@/lib/logger";

export class LoyaltyService {
  static async earnPoints(userId: string, points: number, reason: string, referenceId?: string) {
    const prisma = getPrisma();
    return await prisma.$transaction(async (tx) => {
      // 1. Create transaction log
      await tx.loyalty_transaction.create({
        data: {
          userId,
          points,
          type: "EARNED",
          reason,
          referenceId,
        },
      });

      // 2. Update user points
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { increment: points },
        },
      });

      // 3. Update wallet if points are convertible (optional logic)

      logger.info(`User ${userId} earned ${points} points for ${reason}`);
      return user;
    });
  }

  static async redeemPoints(userId: string, points: number, reason: string) {
    const prisma = getPrisma();
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.loyaltyPoints < points) {
        throw new Error("Insufficient loyalty points");
      }

      await tx.loyalty_transaction.create({
        data: {
          userId,
          points: -points,
          type: "REDEEMED",
          reason,
        },
      });

      return await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { decrement: points },
        },
      });
    });
  }

  static async handleReferral(referrerCode: string, referredUserId: string) {
    try {
      const prisma = getPrisma();
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referrerCode }
      });

      if (!referrer) return;

      await prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: referredUserId,
          code: referrerCode,
          status: "SIGNUP"
        }
      });

      // Award points for signup
      await this.earnPoints(referrer.id, 50, "REFERRAL_SIGNUP", referredUserId);
    } catch (error) {
      logger.error("Referral handling failed", error);
    }
  }
}
