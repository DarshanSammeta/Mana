import "server-only";
import { getPrisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export class PenaltyService {
  /**
   * Applies a reliability penalty to a vendor
   */
  static async applyPenalty(vendorId: string, type: "LATE_ARRIVAL" | "CANCELLATION" | "NO_RESPONSE", bookingId?: string) {
    const prisma = getPrisma();

    const penalties: Record<string, number> = {
      LATE_ARRIVAL: 5,
      CANCELLATION: 15,
      NO_RESPONSE: 10
    };

    const reduction = penalties[type] || 0;

    await prisma.$transaction(async (tx) => {
      // 1. Update Vendor Profile Reliability Score
      const profile = await tx.vendorprofile.findUnique({ where: { userId: vendorId } });
      if (profile) {
        const newScore = Math.max(0, (profile.reliabilityScore || 100) - reduction);
        await tx.vendorprofile.update({
          where: { userId: vendorId },
          data: {
            reliabilityScore: newScore,
            // Automatically suspend if score drops too low
            verificationStatus: newScore < 40 ? "SUSPENDED" : profile.verificationStatus
          }
        });
      }

      // 2. Log Penalty
      await tx.vendor_penalty.create({
        data: {
          vendorId,
          bookingId,
          type,
          pointsDeducted: reduction,
          reason: `Automated penalty for ${type.toLowerCase().replace('_', ' ')}`
        }
      });
    });

    logger.info(`Penalty applied to vendor ${vendorId}: -${reduction} points (${type})`);
  }
}
