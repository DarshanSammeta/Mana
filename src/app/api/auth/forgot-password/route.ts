import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/config/auth-limits";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const body = await req.json();
    const validated = forgotPasswordSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const identifier = `forgot-password:${ip}:${validated.email.toLowerCase()}`;

    const rateLimitResult = await rateLimit(identifier, AUTH_LIMITS.FORGOT_PASSWORD);

    if (!rateLimitResult.success) {
      return rateLimitResponse(
        rateLimitResult,
        `Too many password reset attempts. Please wait ${Math.ceil(rateLimitResult.reset / 60)} minutes.`
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      // Security: Don't reveal if user exists
      return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
    }

    // Logic for generating reset token and sending email would go here
    logger.info("Password reset requested", { userId: user.id });

    return NextResponse.json({ message: "Reset link sent successfully" });
  }, req);
}
