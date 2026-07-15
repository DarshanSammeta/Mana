import { prisma } from "./prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./auth";
import logger from "./logger";

import { user_role } from "@prisma/client";

export class AuthHardening {
  /**
   * Implements Refresh Token Rotation.
   * When a refresh token is used, it is invalidated and a new one is issued.
   * If an invalidated token is used again, it's a sign of theft, and all sessions for that user are revoked.
   */
  static async rotateToken(oldRefreshToken: string) {
    const payload = verifyRefreshToken(oldRefreshToken) as { userId: string, role: user_role } | null;
    if (!payload) {
      throw new Error("Invalid refresh token");
    }

    const userId = payload.userId;

    // 1. Check if the token exists in the database and is not revoked
    const tokenRecord = await prisma.refreshtoken.findUnique({
      where: { token: oldRefreshToken }
    });

    if (!tokenRecord) {
      // Token doesn't exist - possibly already used or malicious
      logger.warn(`Potential Refresh Token Reuse Attack detected for user ${userId}`);
      // Revoke all tokens for this user for safety
      await prisma.refreshtoken.deleteMany({ where: { userId } });
      throw new Error("Security alert: Session revoked");
    }

    // 2. Invalidate the old token and issue new ones
    return await prisma.$transaction(async (tx) => {
      // Delete the used token
      await tx.refreshtoken.delete({ where: { id: tokenRecord.id } });

      const newAccessToken = signAccessToken({ userId: payload.userId, role: payload.role });
      const newRefreshToken = signRefreshToken({ userId: payload.userId, role: payload.role });

      // Save new refresh token
      await tx.refreshtoken.create({
        data: {
          userId: userId,
          token: newRefreshToken,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    });
  }

  /**
   * Revoke all sessions for a user
   */
  static async revokeAllSessions(userId: string) {
    await prisma.refreshtoken.deleteMany({ where: { userId } });
    logger.info(`All sessions revoked for user ${userId}`);
  }
}
