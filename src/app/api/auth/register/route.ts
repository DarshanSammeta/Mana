import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/config/auth-limits";
import { createAuditLog } from "@/lib/audit";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  mobileNumber: z.string().min(10).max(10),
  role: z.enum(["CUSTOMER", "VENDOR"]),
});

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const identifier = `register:${ip}:${validated.email.toLowerCase()}`;

    const rateLimitResult = await rateLimit(identifier, AUTH_LIMITS.REGISTER);
    if (!rateLimitResult.success) {
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
      return NextResponse.json(
        { message: "User with this email or mobile already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(validated.password);

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        fullName: validated.fullName,
        email: validated.email,
        password: hashedPassword,
        mobileNumber: validated.mobileNumber,
        role: validated.role,
        updatedAt: new Date(),
        // Create initial wallet and notification preferences
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
        }
      },
    });

    if (validated.role === "VENDOR") {
      await prisma.vendorprofile.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          businessName: `${user.fullName}'s Business`,
          updatedAt: new Date(),
        },
      });
    }

    await createAuditLog({ userId: user.id, action: "USER_REGISTERED", ipAddress: ip });
    logger.info("New user registered", { userId: user.id, role: user.role });

    // Send Welcome Notification
    try {
      const { sendNotification } = await import("@/lib/notifications");
      await sendNotification({
        userId: user.id,
        title: "Welcome to Mana Events! 🎉",
        message: `Hi ${user.fullName}, we're excited to have you here! Start exploring the marketplace to plan your perfect event.`,
        category: "SYSTEM",
        priority: "MEDIUM"
      });
    } catch (error) {
      logger.error("Failed to send welcome notification", error);
    }

    return NextResponse.json(
      { message: "User registered successfully", userId: user.id },
      { status: 201 }
    );
  }, req);
}
