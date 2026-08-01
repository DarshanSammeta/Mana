import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("LoyaltyService can only be used on the server.");
}
import logger from "@/lib/logger";

export class LoyaltyService {
  /**
   * Earn points for a customer
   * @param customerProfileId - The ID of the CustomerProfile
   */
  static async earnPoints(customerProfileId: string, points: number, reason: string, referenceId?: string) {
    const prisma = getPrisma();
    return await prisma.$transaction(async (tx) => {
      // 1. Create transaction log
      await tx.loyalty_transaction.create({
        data: {
          customerProfileId,
          points,
          type: "EARNED",
          reason,
          referenceId,
        },
      });

      // 2. Update profile points
      const profile = await tx.customerprofile.update({
        where: { id: customerProfileId },
        data: {
          loyaltyPoints: { increment: points },
        },
      });

      logger.info(`CustomerProfile ${customerProfileId} earned ${points} points for ${reason}`);
      return profile;
    });
  }

  /**
   * Redeem points for a customer
   * @param customerProfileId - The ID of the CustomerProfile
   */
  static async redeemPoints(customerProfileId: string, points: number, reason: string) {
    const prisma = getPrisma();
    return await prisma.$transaction(async (tx) => {
      const profile = await tx.customerprofile.findUnique({ where: { id: customerProfileId } });
      if (!profile || profile.loyaltyPoints < points) {
        throw new Error("Insufficient loyalty points");
      }

      await tx.loyalty_transaction.create({
        data: {
          customerProfileId,
          points: -points,
          type: "REDEEMED",
          reason,
        },
      });

      return await tx.customerprofile.update({
        where: { id: customerProfileId },
        data: {
          loyaltyPoints: { decrement: points },
        },
      });
    });
  }

  /**
   * Handle referral points when a new user signs up
   */
  static async handleReferral(referrerCode: string, referredCustomerProfileId: string) {
    try {
      const prisma = getPrisma();
      const referrerProfile = await prisma.customerprofile.findUnique({
        where: { referralCode: referrerCode }
      });

      if (!referrerProfile) {
        logger.warn(`Referral failed: Referrer code ${referrerCode} not found`);
        return;
      }

      await prisma.referral.create({
        data: {
          referrerId: referrerProfile.id,
          referredId: referredCustomerProfileId,
          code: referrerCode,
          status: "SIGNUP"
        }
      });

      // Award points for signup
      await this.earnPoints(referrerProfile.id, 50, "REFERRAL_SIGNUP", referredCustomerProfileId);
    } catch (error) {
      logger.error("Referral handling failed", error);
    }
  }
}
