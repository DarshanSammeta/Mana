import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("referral.service can only be used on the server.");
}
import { LoyaltyService } from "./loyalty.service";
import logger from "@/lib/logger";

export class ReferralService {
  static async generateReferralCode(userId: string) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.referralCode) return user.referralCode;

    const code = `MANA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code }
    });
    return code;
  }

  static async trackBookingCompletion(bookingId: string) {
    try {
      const prisma = getPrisma();
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { user: { include: { referral_received: true } } }
      });

      if (!booking || booking.status !== "EVENT_COMPLETED") return;

      const referral = booking.user.referral_received;
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

  static async getReferralStats(userId: string) {
    const prisma = getPrisma();
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referred: { select: { fullName: true, createdAt: true } } }
    });

    const totalEarned = referrals.reduce((acc, curr) => acc + curr.rewardPoints, 0);

    return {
      referrals,
      totalEarned,
      referralCode: (await prisma.user.findUnique({ where: { id: userId } }))?.referralCode
    };
  }

  static async detectFraud(userId: string, ipAddress: string, deviceId: string) {
    const prisma = getPrisma();
    // Basic fraud detection: same IP/Device for multiple referrals
    const similarReferrals = await prisma.referral_fraud_log.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    if (similarReferrals > 5) {
      await prisma.referral_fraud_log.create({
        data: {
          userId,
          reason: "Excessive referral activity from same source",
          evidence: { ipAddress, deviceId },
          severity: "HIGH"
        }
      });
      return true;
    }
    return false;
  }

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
        const user = await prisma.user.findUnique({ where: { id: l.referrerId }, select: { fullName: true, profileImage: true } });
        return {
            ...l,
            userName: user?.fullName,
            profileImage: user?.profileImage
        };
    }));

    return leaderDetails;
  }
}
