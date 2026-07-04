import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
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
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitResult = await rateLimit(ip, { limit: 5, window: 60 });
    if (!rateLimitResult.success) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const validated = registerSchema.parse(body);

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

    return NextResponse.json(
      { message: "User registered successfully", userId: user.id },
      { status: 201 }
    );
  });
}
