import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("referral.service can only be used on the server.");
}
import { LoyaltyService } from "./loyalty.service";
import logger from "@/lib/logger";

export class ReferralService {
  /**
   * Generates or retrieves a referral code for a customer profile
   */
  static async generateReferralCode(customerProfileId: string) {
    const prisma = getPrisma();
    const profile = await prisma.customerprofile.findUnique({ where: { id: customerProfileId } });
    if (profile?.referralCode) return profile.referralCode;

    const code = `MANA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await prisma.customerprofile.update({
      where: { id: customerProfileId },
      data: { referralCode: code }
    });
    return code;
  }

  /**
   * Tracks booking completion to award referral points
   */
  static async trackBookingCompletion(bookingId: string) {
    try {
      const prisma = getPrisma();
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customerprofile: {
            include: { referral_received: true }
          }
        }
      });

      if (!booking || booking.status !== "EVENT_COMPLETED") return;

      const referral = booking.customerprofile.referral_received;
      if (referral && referral.status === "SIGNUP") {
        // Update referral status
        await prisma.referral.update({
          where: { id: referral.id },
          data: { status: "BOOKING_COMPLETED", rewardPoints: 200 }
        });

        // Reward the referrer
        await LoyaltyService.earnPoints(referral.referrerId, 200, "REFERRAL_BOOKING", bookingId);

        // Reward the referred user too
        await LoyaltyService.earnPoints(referral.referredId, 100, "FIRST_BOOKING_REFERRAL", bookingId);
      }
    } catch (error) {
      logger.error("Error tracking referral booking completion", error);
    }
  }

  /**
   * Gets referral statistics for a customer profile
   */
  static async getReferralStats(customerProfileId: string) {
    const prisma = getPrisma();
    const referrals = await prisma.referral.findMany({
      where: { referrerId: customerProfileId },
      include: {
        referred: {
          include: {
            user: { select: { fullName: true, createdAt: true } }
          }
        }
      }
    });

    const totalEarned = referrals.reduce((acc, curr) => acc + curr.rewardPoints, 0);
    const profile = await prisma.customerprofile.findUnique({
      where: { id: customerProfileId },
      select: { referralCode: true }
    });

    return {
      referrals: referrals.map(r => ({
        ...r,
        userName: r.referred.user.fullName,
        createdAt: r.referred.user.createdAt
      })),
      totalEarned,
      referralCode: profile?.referralCode
    };
  }

  /**
   * Basic fraud detection for referrals
   */
  static async detectFraud(customerProfileId: string, ipAddress: string, deviceId: string) {
    const prisma = getPrisma();
    // Basic fraud detection: too many referrals in 24h
    const recentLogsCount = await prisma.referral_fraud_log.count({
      where: {
        customerProfileId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    if (recentLogsCount > 5) {
      await prisma.referral_fraud_log.create({
        data: {
          customerProfileId,
          reason: "Excessive referral activity from same source",
          evidence: { ipAddress, deviceId },
          severity: "HIGH"
        }
      });
      return true;
    }
    return false;
  }

  /**
   * Gets the referral leaderboard
   */
  static async getReferralLeaderboard() {
    const prisma = getPrisma();
    const leaders = await prisma.referral.groupBy({
      by: ['referrerId'],
      _count: { id: true },
      _sum: { rewardPoints: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const leaderDetails = await Promise.all(leaders.map(async (l) => {
        const profile = await prisma.customerprofile.findUnique({
          where: { id: l.referrerId },
          include: { user: { select: { fullName: true } } }
        });
        return {
            ...l,
            userName: profile?.user.fullName,
            profileImage: profile?.profileImage
        };
    }));

    return leaderDetails;
  }
}
