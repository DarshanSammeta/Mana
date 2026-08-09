import { prisma } from "@/lib/prisma";
import { safeRedis } from "@/lib/redis";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  SessionData,
} from "@/lib/auth/token-logic";
import { createHash, randomUUID } from "crypto";
import logger from "@/lib/logger";

const ACCESS_TOKEN_MAX_AGE = 900; // 15 Minutes
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 Days
const GRACE_PERIOD_MS = 15_000;
const ROTATION_CACHE_TTL_SEC = (GRACE_PERIOD_MS / 1000) + 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export interface SessionContext {
  ipAddress?: string;
  userAgent?: string;
}

interface RotationResult {
  accessToken: string;
  refreshToken: string;
  sessionData: {
    userId: string;
    role: string;
    verificationStatus?: string | null;
  };
  rotatedAt: number;
}

type RotationOutcome =
  | { type: "not_found" }
  | { type: "hash_mismatch"; userId: string }
  | { type: "expired" }
  | { type: "already_rotated"; userId: string; revokedAt: Date | null }
  | { type: "race_lost"; userId: string; revokedAt: Date | null }
  | {
      type: "success";
      result: RotationResult;
      oldTokenHash: string;
      newTokenHash: string;
    };

export const SessionService = {
  async createSession(data: SessionData, context: SessionContext = {}) {
    const { userId, role, verificationStatus } = data;
    const sessionId = randomUUID();

    const accessToken = await signAccessToken({
      userId,
      role,
      verificationStatus,
      sessionId,
      id: userId,
    });

    const refreshToken = await signRefreshToken({ userId, sessionId, role });
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshtoken.create({
      data: {
        id: sessionId,
        tokenHash,
        userId,
        expiryDate: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    await safeRedis.set(
      `session:rt:${tokenHash}`,
      JSON.stringify({ ...data, sessionId }),
      REFRESH_TOKEN_MAX_AGE
    );

    return { accessToken, refreshToken };
  },

  async revokeSession(refreshToken: string) {
    const payload = await verifyRefreshToken(refreshToken).catch(() => null);
    if (!payload) return;

    await prisma.refreshtoken.updateMany({
      where: { id: payload.sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const tokenHash = hashToken(refreshToken);
    await safeRedis.del(`session:rt:${tokenHash}`);
  },

  /**
   * REFRESH SESSION (PRODUCTION AUDITED)
   * Implements Distributed Locking + Idempotency Cache + Multi-tab Safety.
   */
  async refreshSession(
    refreshToken: string,
    context: SessionContext = {}
  ): Promise<RotationResult | null> {
    const payload = await verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const hashPrefix = tokenHash.substring(0, 8);

    console.log("[BACKEND REFRESH DEBUG] start", {
      jwtVerified: !!payload,
      sessionId: payload?.sessionId,
      hashPrefix
    });

    if (!payload) return null;

    // 1. FAST PATH: Check Idempotency Cache
    let cached = await safeRedis.get<RotationResult>(`rotation_cache:${tokenHash}`);
    if (cached) {
       const age = Date.now() - cached.rotatedAt;
       console.log("[BACKEND REFRESH DEBUG] cache check", { found: true, age });
       if (age <= GRACE_PERIOD_MS) {
         return cached;
       }
    }

    // 2. DISTRIBUTED LOCKING
    const lockKey = `refresh_lock:${payload.sessionId}`;
    const lockValue = randomUUID();
    const lockAcquired = await safeRedis.setNX(lockKey, lockValue, 10); // 10s lock

    console.log("[BACKEND REFRESH DEBUG] lock check", { lockAcquired });

    if (!lockAcquired) {
       for (let i = 0; i < 5; i++) {
         console.log("[BACKEND REFRESH DEBUG] polling for concurrent winner", { attempt: i + 1 });
         await new Promise(r => setTimeout(resolve => r(null), 500));
         cached = await safeRedis.get<RotationResult>(`rotation_cache:${tokenHash}`);
         if (cached) return cached;
       }
       return null;
    }

    let outcome: RotationOutcome;
    try {
      outcome = await prisma.$transaction(async (tx) => {
        const session = await tx.refreshtoken.findUnique({
          where: { id: payload.sessionId },
          include: { user: { include: { vendorprofile: { select: { verificationStatus: true } } } } }
        });

        console.log("[BACKEND REFRESH DEBUG] db lookup", {
          found: !!session,
          hashMatch: session?.tokenHash === tokenHash,
          revokedAt: session?.revokedAt,
          expired: session ? session.expiryDate < new Date() : undefined
        });

        if (!session) return { type: "not_found" };
        if (session.tokenHash !== tokenHash) return { type: "hash_mismatch", userId: session.userId };
        if (session.expiryDate < new Date()) return { type: "expired" };
        if (session.revokedAt) return { type: "already_rotated", userId: session.userId, revokedAt: session.revokedAt };

        const newSessionId = randomUUID();
        const newAccessToken = await signAccessToken({
          userId: session.user.id,
          role: session.user.role,
          verificationStatus: session.user.vendorprofile?.verificationStatus,
          sessionId: newSessionId,
          id: session.user.id,
        });

        const newRefreshToken = await signRefreshToken({ userId: session.user.id, sessionId: newSessionId, role: session.user.role });
        const newTokenHash = hashToken(newRefreshToken);

        const updated = await tx.refreshtoken.updateMany({
          where: { id: session.id, revokedAt: null },
          data: { revokedAt: new Date(), replacedBy: newTokenHash },
        });

        if (updated.count === 0) return { type: "race_lost", userId: session.userId, revokedAt: new Date() };

        await tx.refreshtoken.create({
          data: {
            id: newSessionId,
            tokenHash: newTokenHash,
            userId: session.userId,
            expiryDate: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000),
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
        });

        return {
          type: "success",
          result: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            sessionData: { userId: session.user.id, role: session.user.role, verificationStatus: session.user.vendorprofile?.verificationStatus },
            rotatedAt: Date.now(),
          },
          oldTokenHash: tokenHash,
          newTokenHash,
        } as const;
      });
    } finally {
      await safeRedis.compareAndDel(lockKey, lockValue);
    }

    console.log("[BACKEND REFRESH DEBUG] outcome", { type: outcome.type });

    if (outcome.type === "success") {
      const { result, oldTokenHash, newTokenHash } = outcome;
      await Promise.all([
        safeRedis.set(`rotation_cache:${oldTokenHash}`, result, ROTATION_CACHE_TTL_SEC),
        safeRedis.set(`session:rt:${newTokenHash}`, JSON.stringify(result.sessionData), REFRESH_TOKEN_MAX_AGE),
        safeRedis.del(`session:rt:${oldTokenHash}`)
      ]);
      return result;
    }

    if (outcome.type === "already_rotated" || outcome.type === "race_lost") {
      const age = Date.now() - (outcome.revokedAt?.getTime() || 0);
      if (age < GRACE_PERIOD_MS) {
        return await safeRedis.get<RotationResult>(`rotation_cache:${tokenHash}`);
      }
      logger.error(`[SECURITY] REUSE DETECTED user=${outcome.userId}. Revoking all.`);
      await this.revokeAllUserSessions(outcome.userId);
    }

    return null;
  },

  async revokeAllUserSessions(userId: string, exceptTokenHash?: string) {
    await prisma.refreshtoken.updateMany({
      where: {
        userId,
        revokedAt: null,
        NOT: exceptTokenHash ? { tokenHash: exceptTokenHash } : undefined
      },
      data: { revokedAt: new Date() },
    });
    // In production, we'd also clear Redis keys or use a versioned session key
  },

  setSessionCookies(response: any, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === "production";
    const options = {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      path: "/",
      domain: undefined,
    };

    response.cookies.set("accessToken", accessToken, { ...options, maxAge: ACCESS_TOKEN_MAX_AGE });
    response.cookies.set("refreshToken", refreshToken, { ...options, maxAge: REFRESH_TOKEN_MAX_AGE });
    return response;
  },
};
