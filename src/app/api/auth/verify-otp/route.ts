import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/server/audit.service";
import { withErrorHandler } from "@/lib/error-handler";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/config/auth-limits";
import { SessionService } from "@/services/server/session.service";
import { timingSafeEqual } from "crypto";

import { verifyOTPSchema } from "@/validations/auth";

/**
 * Constant-time comparison for OTP strings to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const body = await req.json();
    const validated = verifyOTPSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // 1. Perimeter Rate Limiting
    const identifier = `otp-verify:${ip}:${validated.userId}`;
    const rateLimitResult = await rateLimit(identifier, AUTH_LIMITS.OTP_VERIFY);
    if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult);

    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
      include: {
        vendorprofile: { select: { verificationStatus: true } }
      }
    });

    if (!user) return NextResponse.json({ message: "Invalid session" }, { status: 401 });

    // 2. Account Lockout Check
    if (user.lockUntil && user.lockUntil > new Date()) {
        return NextResponse.json({ message: "Too many failed attempts. Try again later." }, { status: 403 });
    }

    if (!user.otp || !user.otpExpiry) {
      return NextResponse.json({ message: "No active code found" }, { status: 401 });
    }

    // 3. Expiration Check
    if (new Date() > user.otpExpiry) {
      return NextResponse.json({ message: "Code expired" }, { status: 401 });
    }

    // 4. Timing-Safe Comparison
    const isMatch = safeCompare(validated.otp.trim(), user.otp.trim());

    if (!isMatch) {
      // 5. Increment failed attempts
      const newAttempts = user.loginAttempts + 1;
      const isLocked = newAttempts >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
            loginAttempts: newAttempts,
            lockUntil: isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null // 15 min lock
        }
      });

      if (isLocked) {
          await AuditService.log({
              entityType: "USER",
              entityId: user.id,
              module: "AUTH",
              action: "ACCOUNT_LOCKED",
              metadata: { reason: "OTP_FAILED_LIMIT" }
          });
      }

      return NextResponse.json({ message: "Invalid verification code" }, { status: 401 });
    }

    // 6. Success: Clear OTP and create session
    const { accessToken, refreshToken } = await SessionService.createSession({
        userId: user.id,
        role: user.role,
        verificationStatus: (user as any).vendorprofile?.verificationStatus
    }, {
        ipAddress: ip,
        userAgent: userAgent
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiry: null,
        isEmailVerified: true,
        loginAttempts: 0,
        lockUntil: null
      }
    });

    await AuditService.logAuth(user.id, "LOGIN_SUCCESS_2FA", user.role, user.fullName);

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        verificationStatus: user.role === 'VENDOR' ? (user as any).vendorprofile?.verificationStatus : undefined
      },
      accessToken,
    });

    return SessionService.setSessionCookies(response, accessToken, refreshToken);
  });
}
