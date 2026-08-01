import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/config/auth-limits";
import { AuditService } from "@/services/server/audit.service";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { SessionService } from "@/services/server/session.service";
import { comparePassword } from "@/lib/auth";

import { loginSchema } from "@/validations/auth";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const body = await req.json();
    const validated = loginSchema.parse(body);
    const requestedRole = validated.role || "CUSTOMER";

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const identifier = `login:${ip}:${validated.email.toLowerCase()}`;

    const rateLimitResult = await rateLimit(identifier, AUTH_LIMITS.LOGIN);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        role: true,
        lockUntil: true,
        loginAttempts: true,
        vendorprofile: {
          select: {
            id: true,
            businessName: true,
            verificationStatus: true,
            isActive: true,
            category: { select: { name: true } },
            service: { select: { id: true, title: true }, take: 5 }
          }
        },
        customerprofile: {
          select: {
            id: true,
            loyaltyPoints: true,
            referralCode: true
          }
        },
      },
    });

    if (!user) {
      logger.warn("Login failed: User not found", { email: validated.email, ip });
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // 1. Account Lockout Check
    if (user.lockUntil && user.lockUntil > new Date()) {
      logger.warn("Login attempt on locked account", { userId: user.id, email: user.email });
      return NextResponse.json({ message: "Account locked. Try again in 15 minutes." }, { status: 403 });
    }

    // 2. Password Verification & Attempt Tracking
    const isMatch = await comparePassword(validated.password, user.password);

    if (!isMatch) {
        const newAttempts = user.loginAttempts + 1;
        const isLocked = newAttempts >= 5;

        await prisma.user.update({
            where: { id: user.id },
            data: {
                loginAttempts: newAttempts,
                lockUntil: isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null
            }
        });

        if (isLocked) {
            await AuditService.log({
                entityType: "USER",
                entityId: user.id,
                module: "AUTH",
                action: "ACCOUNT_LOCKED",
                metadata: { reason: "PASSWORD_FAILED_LIMIT" }
            });
        }

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

      if (status === "REJECTED") {
        return NextResponse.json({ message: "Your vendor registration has been rejected." }, { status: 403 });
      }

      if (status === "SUSPENDED") {
        return NextResponse.json({ message: "Your vendor account is suspended. Please contact support." }, { status: 403 });
      }
    }

    // 2FA logic for CUSTOMER and VENDOR roles
    if (user.role === "CUSTOMER" || user.role === "VENDOR") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp,
          otpExpiry
        }
      });

      const { sendOTPEmail } = await import("@/lib/mail/resend");

      if (!process.env.RESEND_API_KEY) {
        // Only log in dev/testing if no key present
        console.log(`[AUTH] Generated OTP for ${user.email}: ${otp}`);
      }

      try {
        await sendOTPEmail(user.email, otp);
      } catch (mailError) {
        logger.error("Failed to send OTP email", { error: mailError, userId: user.id });
      }

      return NextResponse.json({
        message: "OTP sent to your email",
        requiresOTP: true,
        userId: user.id
      });
    }

    // SUCCESS flow for roles without 2FA (e.g. ADMIN)
    const { accessToken, refreshToken } = await SessionService.createSession({
        userId: user.id,
        role: user.role,
        verificationStatus: user.vendorprofile?.verificationStatus
    }, {
        ipAddress: ip,
        userAgent: userAgent
    });

    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockUntil: null }
      }),
      AuditService.logAuth(user.id, "LOGIN_SUCCESS", user.role, user.fullName)
    ]);

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        verificationStatus: user.vendorprofile?.verificationStatus
      },
      customerProfile: user.customerprofile ? {
        id: user.customerprofile.id,
        loyaltyPoints: user.customerprofile.loyaltyPoints,
        referralCode: user.customerprofile.referralCode
      } : null,
      vendorProfile: user.vendorprofile ? {
        id: user.vendorprofile.id,
        businessName: user.vendorprofile.businessName,
        category: user.vendorprofile.category?.name,
        services: user.vendorprofile.service
      } : null,
      accessToken,
    });

    return SessionService.setSessionCookies(response, accessToken, refreshToken);
  }, req);
}
