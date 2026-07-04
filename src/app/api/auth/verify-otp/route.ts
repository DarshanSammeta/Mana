import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const verifyOTPSchema = z.object({
  userId: z.string(),
  otp: z.string().length(6),
});

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Rate limit OTP verification attempts (3 attempts per minute)
    const rateLimitResult = await rateLimit(`otp-verify-${ip}`, { limit: 3, window: 60 });
    if (!rateLimitResult.success) {
      return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const validated = verifyOTPSchema.parse(body);

    logger.info("OTP Verification attempt", { userId: validated.userId, ip });

    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
    });

    if (!user) {
      logger.warn("OTP Verification failed: User not found", { userId: validated.userId });
      return NextResponse.json({
        message: "Invalid or expired session. Please login again.",
        _dev_reason: process.env.NODE_ENV === "development" ? "User not found by ID" : undefined
      }, { status: 401 });
    }

    if (!user.otp || !user.otpExpiry) {
      logger.warn("OTP Verification failed: No OTP active", { userId: user.id });
      return NextResponse.json({
        message: "No active verification code found. Please login again.",
        _dev_reason: process.env.NODE_ENV === "development" ? "otp or otpExpiry is null in DB" : undefined
      }, { status: 401 });
    }

    const now = new Date();
    // Use a small buffer (5 seconds) for network latency/clock drift
    const expiryWithBuffer = new Date(user.otpExpiry.getTime() + 5000);

    if (expiryWithBuffer < now) {
      logger.warn("OTP Verification failed: Expired", {
        userId: user.id,
        expiry: user.otpExpiry,
        now
      });
      return NextResponse.json({
        message: "Verification code has expired. Please login again.",
        _dev_reason: process.env.NODE_ENV === "development" ? `Expired at ${user.otpExpiry.toISOString()}` : undefined
      }, { status: 401 });
    }

    // Trim and compare to avoid whitespace issues
    const providedOtp = validated.otp.trim();
    const storedOtp = user.otp.trim();

    if (storedOtp !== providedOtp) {
      logger.warn("OTP Verification failed: Incorrect code", {
        userId: user.id,
        provided: providedOtp,
        expected: storedOtp
      });
      return NextResponse.json({
        message: "Invalid verification code",
        _dev_reason: process.env.NODE_ENV === "development" ? `Expected ${storedOtp}, got ${providedOtp}` : undefined
      }, { status: 401 });
    }

    // OTP is valid - clear it and create session
    // We do this in a transaction to ensure atomicity
    const [refreshTokenResult] = await prisma.$transaction([
      prisma.refreshtoken.create({
        data: {
          id: crypto.randomUUID(),
          token: generateRefreshToken(user.id),
          userId: user.id,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          otp: null,
          otpExpiry: null,
          isEmailVerified: true,
          loginAttempts: 0 // Reset attempts on successful 2FA
        }
      }),
      // Audit log as part of transaction or separately
    ]);

    // Separate audit log creation to not block the main transaction if it's slow
    createAuditLog({
      userId: user.id,
      action: "LOGIN_SUCCESS_2FA",
      ipAddress: ip
    }).catch(err => logger.error("Audit log failed after OTP", err));

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = refreshTokenResult.token;

    logger.info("2FA Login successful", { userId: user.id });

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
    };

    response.cookies.set("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 });
    response.cookies.set("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 });

    return response;
  });
}
