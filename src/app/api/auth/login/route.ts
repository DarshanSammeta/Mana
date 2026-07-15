import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/config/auth-limits";
import { createAuditLog } from "@/lib/audit";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  role: z.enum(["CUSTOMER", "VENDOR"]).optional(),
});

export async function POST(req: Request) {
  const startTime = process.hrtime();
  return withErrorHandler(async () => {
    const body = await req.json();
    const validated = loginSchema.parse(body);
    const requestedRole = validated.role || "CUSTOMER";

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    // IP + Email prevents office/shared WiFi from blocking every user
    const identifier = `login:${ip}:${validated.email.toLowerCase()}`;

    const rateLimitResult = await rateLimit(identifier, AUTH_LIMITS.LOGIN);

    if (!rateLimitResult.success) {
      logger.warn(`Rate limit exceeded for login: ${identifier}`);
      return rateLimitResponse(
        rateLimitResult,
        `Too many login attempts. Please wait ${Math.ceil(rateLimitResult.reset / 60)} minutes.`
      );
    }

    const dbStartTime = process.hrtime();
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      include: {
        vendorprofile: true,
      },
    });
    const dbEndTime = process.hrtime(dbStartTime);
    const dbDuration = (dbEndTime[0] * 1000 + dbEndTime[1] / 1000000).toFixed(2);

    if (!user) {
      await createAuditLog({ action: "LOGIN_FAILED", details: { email: validated.email }, ipAddress: ip });
      logger.warn("Login failed: User not found", { email: validated.email, ip });
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Role Enforcement
    if (requestedRole === "VENDOR") {
      if (user.role !== "VENDOR") {
        return NextResponse.json({ message: "This account is not registered as a Vendor." }, { status: 403 });
      }

      if (!user.vendorprofile) {
        return NextResponse.json({ message: "Vendor profile not found." }, { status: 403 });
      }

      const status = user.vendorprofile.verificationStatus;
      const isActive = user.vendorprofile.isActive;

      if (!isActive) {
        return NextResponse.json({ message: "Your vendor account has been deactivated. Please contact support." }, { status: 403 });
      }

      // Allow login for PENDING vendors so they can complete onboarding
      // They will be restricted at the dashboard/middleware level if needed
      if (status === "REJECTED") {
        return NextResponse.json({ message: "Your vendor registration has been rejected." }, { status: 403 });
      }

      if (status === "SUSPENDED") {
        return NextResponse.json({ message: "Your vendor account is suspended. Please contact support." }, { status: 403 });
      }
    } else if (requestedRole === "CUSTOMER") {
      // If a vendor tries to login as customer, we allow it (as vendors can also be customers)
      // but if we want strict CUSTOMER-only for the customer login flow:
      // if (user.role !== "CUSTOMER") { ... }
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      logger.warn("Login attempt on locked account", { userId: user.id, email: user.email });
      return NextResponse.json({ message: "Account locked. Try again later." }, { status: 403 });
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

      const endTime = process.hrtime(startTime);
      const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
      logger.info(`Login (2FA) API Performance: ${duration}ms (DB: ${dbDuration}ms)`);

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
        verificationStatus: (user.role as string) === 'VENDOR' ? (user.vendorprofile?.verificationStatus as string) : undefined
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

    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
    logger.info(`Login (Direct) API Performance: ${duration}ms (DB: ${dbDuration}ms)`);

    return response;
  }, req);
}

