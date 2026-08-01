import { prisma } from "@/lib/prisma";
import { safeRedis } from "@/lib/redis";
import { signAccessToken, signRefreshToken, verifyRefreshToken, SessionData } from "@/lib/auth/token-logic";
import { createHash } from "crypto";
import logger from "@/lib/logger";

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes (Matches JWT)
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days (Matches JWT)

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export interface SessionContext {
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  deviceName?: string;
}

export const SessionService = {
  /**
   * Create a new session (DB + Redis)
   */
  async createSession(data: SessionData, context: SessionContext = {}) {
    const { userId, role, verificationStatus } = data;

    // 1. Generate Tokens
    const accessToken = await signAccessToken({ userId, role, verificationStatus });
    const refreshToken = await signRefreshToken({ userId });
    const tokenHash = hashToken(refreshToken);

    // 2. Persist in DB
    const session = await prisma.refreshtoken.create({
      data: {
        id: crypto.randomUUID(),
        tokenHash: tokenHash,
        userId: userId,
        expiryDate: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        browser: context.browser,
        os: context.os,
        deviceName: context.deviceName,
      },
    });

    // 3. Cache in Redis (Matches JWT TTL)
    // We store the session metadata in Redis too for fast verification
    await safeRedis.set(`session:rt:${tokenHash}`, JSON.stringify({ ...data, sessionId: session.id }), REFRESH_TOKEN_MAX_AGE);

    return { accessToken, refreshToken };
  },

  /**
   * Refresh session with Token Rotation and Reuse Detection
   */
  async refreshSession(refreshToken: string, context: SessionContext = {}) {
    // 1. Verify JWT (Jose checks signature & expiration)
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) return null;

    const tokenHash = hashToken(refreshToken);

    // 2. Lookup session in DB (Hashed)
    const session = await prisma.refreshtoken.findUnique({
      where: { tokenHash },
      include: { user: { include: { vendorprofile: { select: { verificationStatus: true } } } } }
    });

    // 3. Reuse Detection
    if (!session || session.revokedAt || session.expiryDate < new Date()) {
        if (session?.revokedAt) {
            // SECURITY ALERT: Token reuse detected!
            // This means someone is using a token that has already been rotated.
            // As a precaution, we revoke ALL sessions for this user.
            await this.revokeAllUserSessions(payload.userId);
            logger.error(`[SECURITY] Refresh token reuse detected for user ${payload.userId}. ALL sessions revoked.`, {
                tokenHash,
                ip: context.ipAddress
            });
        }
        return null;
    }

    // 4. Invalidate old token and issue new pair (Rotation)
    const newAccessToken = await signAccessToken({
        userId: session.user.id,
        role: session.user.role,
        verificationStatus: session.user.vendorprofile?.verificationStatus
    });
    const newRefreshToken = await signRefreshToken({ userId: session.user.id });
    const newTokenHash = hashToken(newRefreshToken);

    await prisma.$transaction([
        // Mark old token as revoked
        prisma.refreshtoken.update({
            where: { id: session.id },
            data: {
                revokedAt: new Date(),
                replacedBy: newTokenHash
            }
        }),
        // Create new token
        prisma.refreshtoken.create({
            data: {
                id: crypto.randomUUID(),
                tokenHash: newTokenHash,
                userId: session.userId,
                expiryDate: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000),
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                browser: context.browser,
                os: context.os,
                deviceName: context.deviceName,
            }
        })
    ]);

    // Clear old redis cache
    await safeRedis.del(`session:rt:${tokenHash}`);

    // Update Redis with new session data
    const sessionData = {
        userId: session.user.id,
        role: session.user.role,
        verificationStatus: session.user.vendorprofile?.verificationStatus
    };
    await safeRedis.set(`session:rt:${newTokenHash}`, JSON.stringify(sessionData), REFRESH_TOKEN_MAX_AGE);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, sessionData };
  },

  /**
   * Revoke single session
   */
  async revokeSession(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await Promise.all([
      prisma.refreshtoken.deleteMany({ where: { tokenHash } }),
      safeRedis.del(`session:rt:${tokenHash}`)
    ]);
  },

  /**
   * Revoke ALL sessions for a user (Global Logout)
   */
  async revokeAllUserSessions(userId: string, exceptTokenHash?: string) {
    // 1. Get all session hashes to clear from Redis
    const sessions = await prisma.refreshtoken.findMany({
        where: {
            userId,
            tokenHash: exceptTokenHash ? { not: exceptTokenHash } : undefined,
            revokedAt: null
        },
        select: { tokenHash: true }
    });

    // 2. Atomic DB delete + Redis clear
    await prisma.refreshtoken.deleteMany({
        where: {
            userId,
            tokenHash: exceptTokenHash ? { not: exceptTokenHash } : undefined
        }
    });

    if (sessions.length > 0) {
        await Promise.all(sessions.map(s => safeRedis.del(`session:rt:${s.tokenHash}`)));
    }

    logger.info(`Global logout performed for user ${userId}`, { sessionCount: sessions.length });
  },

  /**
   * Helper to set cookies on a response
   */
  setSessionCookies(response: any, accessToken: string, refreshToken?: string) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
    };

    response.cookies.set("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: ACCESS_TOKEN_MAX_AGE
    });

    if (refreshToken) {
      response.cookies.set("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: REFRESH_TOKEN_MAX_AGE
      });
    }

    return response;
  }
};
