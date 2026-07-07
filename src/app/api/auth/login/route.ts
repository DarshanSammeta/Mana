import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await rateLimit(ip, { limit: 5, window: 60 });
    if (!rateLimitResult.success) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const validated = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      await createAuditLog({ action: "LOGIN_FAILED", details: { email: validated.email }, ipAddress: ip });
      logger.warn("Login failed: User not found", { email: validated.email, ip });
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      logger.warn("Login attempt on locked account", { userId: user.id, email: user.email });
      return NextResponse.json({ message: "Account locked. Try again later." }, { status: 403 });
    }

    const isPasswordValid = await comparePassword(validated.password, user.password);
    if (!isPasswordValid) {
      const attempts = user.loginAttempts + 1;
      let lockUntil = null;
      if (attempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        logger.warn("Account locked due to multiple failed attempts", { userId: user.id, email: user.email });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, lockUntil }
      });

      await createAuditLog({ userId: user.id, action: "LOGIN_FAILED", details: { email: validated.email, attempts }, ipAddress: ip });
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // 2FA logic for CUSTOMER and VENDOR roles
    if (user.role === "CUSTOMER" || user.role === "VENDOR") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Atomic update: Reset attempts and set OTP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockUntil: null,
          otp,
          otpExpiry
        }
      });

      const { sendOTPEmail } = await import("@/lib/mail/resend");

      // Development helper: log OTP if Resend key is missing
      if (!process.env.RESEND_API_KEY) {
        logger.info(`[AUTH] Generated OTP for ${user.email}: ${otp}`);
      }

      try {
        await sendOTPEmail(user.email, otp);
      } catch (mailError) {
        logger.error("Failed to send OTP email", { error: mailError, userId: user.id });
      }

      logger.info("2FA OTP generated", { userId: user.id, email: user.email });

      return NextResponse.json({
        message: "OTP sent to your email",
        requiresOTP: true,
        userId: user.id,
        // Return OTP in response ONLY in development for testing
        // Check both NODE_ENV and a potential override for flexibility
        ...(process.env.NODE_ENV === "development" ? { _dev_otp: otp } : {})
      });
    }

    // SUCCESS flow for roles without 2FA (e.g. ADMIN)
    const [,, refreshTokenResult] = await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockUntil: null }
      }),
      createAuditLog({ userId: user.id, action: "LOGIN_SUCCESS", ipAddress: ip }),
      prisma.refreshtoken.create({
        data: {
          id: crypto.randomUUID(),
          token: generateRefreshToken(user.id),
          userId: user.id,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
    ]);

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = refreshTokenResult.token;

    logger.info("User logged in successfully (No 2FA)", { userId: user.id, role: user.role });

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

    // Set tokens in cookies
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
