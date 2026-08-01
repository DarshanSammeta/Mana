import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/validations/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/config/auth-limits";
import { AuditService } from "@/services/server/audit.service";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    let body;
    try {
      body = await req.json();
      logger.info("[RegisterAPI] Request body received", { email: body.email, role: body.role });
    } catch (e) {
      logger.error("[RegisterAPI] Failed to parse request body", e);
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    // 1. Request Validation
    let validated;
    try {
      validated = registerSchema.parse(body);
      logger.info("[RegisterAPI] Validation successful");
    } catch (e: any) {
      logger.warn("[RegisterAPI] Validation failed", { errors: e.errors });
      throw e; // withErrorHandler will handle ZodError
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const identifier = `register:${ip}:${validated.email.toLowerCase()}`;

    const rateLimitResult = await rateLimit(identifier, AUTH_LIMITS.REGISTER);
    if (!rateLimitResult.success) {
      logger.warn("[RegisterAPI] Rate limit exceeded", { identifier });
      return rateLimitResponse(
        rateLimitResult,
        `Too many registration attempts. Please wait ${Math.ceil(rateLimitResult.reset / 60)} minutes.`
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validated.email }, { mobileNumber: validated.mobileNumber }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === validated.email ? "Email" : "Mobile number";
      logger.warn("[RegisterAPI] User already exists", { field, email: validated.email });
      return NextResponse.json(
        { message: `${field} already exists` },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(validated.password);

    // 2. User Creation with Profiles
    let user;
    try {
      logger.info("[RegisterAPI] Creating user record and profiles...");
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          fullName: validated.fullName,
          email: validated.email,
          password: hashedPassword,
          mobileNumber: validated.mobileNumber,
          role: validated.role,
          updatedAt: new Date(),
          wallet: {
            create: {
              id: crypto.randomUUID(),
              balance: 0,
              pendingBalance: 0,
              withdrawable: 0
            }
          },
          notification_preference: {
            create: {
              id: crypto.randomUUID(),
              category: "SYSTEM",
              email: true,
              sms: true,
              push: true
            }
          },
          // Create CustomerProfile if role is CUSTOMER
          ...(validated.role === "CUSTOMER" ? {
            customerprofile: {
              create: {
                id: crypto.randomUUID(),
                referralCode: `ME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                updatedAt: new Date(),
              }
            }
          } : {})
        },
        include: {
          customerprofile: true
        }
      });
      logger.info("[RegisterAPI] User record created", { userId: user.id });
    } catch (e: any) {
      logger.error("[RegisterAPI] User creation failed", {
        message: e.message,
        code: e.code,
        meta: e.meta,
        stack: e.stack
      });
      throw e;
    }

    // Handle Referral Tracking
    if (validated.role === "CUSTOMER" && validated.referralCode && user.customerprofile) {
      try {
        const referrerProfile = await prisma.customerprofile.findUnique({
          where: { referralCode: validated.referralCode }
        });

        if (referrerProfile) {
          await prisma.referral.create({
            data: {
              id: crypto.randomUUID(),
              referrerId: referrerProfile.id,
              referredId: user.customerprofile.id,
              code: validated.referralCode,
              status: "PENDING",
              rewardPoints: 100,
            }
          });
          logger.info("[RegisterAPI] Referral record created");
        }
      } catch (e) {
        logger.error("[RegisterAPI] Referral handling failed (non-blocking)", e);
      }
    }

    // 3. VendorProfile Creation
    if (validated.role === "VENDOR") {
      try {
        logger.info("[RegisterAPI] Creating vendor profile...");
        await prisma.vendorprofile.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            businessName: validated.businessName || `${user.fullName}'s Business`,
            description: validated.description,
            categoryId: validated.categoryId,
            experienceYears: validated.experienceYears || 0,
            state: validated.state,
            city: validated.city,
            address: validated.address,
            zipCode: validated.pincode,
            gstNumber: validated.gstNumber,
            panNumber: validated.panNumber,
            aadhaarNumber: validated.aadhaarNumber,
            updatedAt: new Date(),
          },
        });
        logger.info("[RegisterAPI] Vendor profile created");
      } catch (e: any) {
        logger.error("[RegisterAPI] Vendor profile creation failed", {
          message: e.message,
          code: e.code,
          meta: e.meta,
          stack: e.stack
        });
        throw e;
      }
    }

    try {
      await AuditService.logAuth(user.id, "USER_REGISTERED", user.role, user.fullName);
    } catch (e) {
      logger.error("[RegisterAPI] Audit log failed (non-blocking)", e);
    }

    if (validated.role === "VENDOR") {
      try {
        const { NotificationService } = await import("@/lib/notifications");
        await NotificationService.triggers.vendorAccountStatus(user.id, "PENDING");
      } catch (error) {
        logger.error("[RegisterAPI] Failed to send vendor notification", error);
      }
    }

    // 4. Send Welcome Notification
    try {
      const { sendNotification } = await import("@/lib/notifications");
      await sendNotification({
        userId: user.id,
        title: "Welcome to Mana Events! 🎉",
        message: `Hi ${user.fullName}, we're excited to have you here! Start exploring the marketplace to plan your perfect event.`,
        category: "SYSTEM",
        priority: "MEDIUM"
      });
      logger.info("[RegisterAPI] Welcome notification sent");
    } catch (error) {
      logger.error("[RegisterAPI] Failed to send welcome notification", error);
    }

    logger.info("[RegisterAPI] Registration successful", { userId: user.id });
    return NextResponse.json(
      { message: "User registered successfully", userId: user.id },
      { status: 201 }
    );
  }, req);
}
