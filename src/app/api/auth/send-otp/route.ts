import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/config/auth-limits";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

const sendOTPSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const body = await req.json();
    const validated = sendOTPSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const identifier = `otp-send:${ip}:${validated.email.toLowerCase()}`;

    const rateLimitResult = await rateLimit(identifier, AUTH_LIMITS.OTP_SEND);

    if (!rateLimitResult.success) {
      return rateLimitResponse(
        rateLimitResult,
        `Too many OTP requests. Please wait ${Math.ceil(rateLimitResult.reset / 60)} minutes.`
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      // Security: Don't reveal if user exists
      return NextResponse.json({ message: "If an account exists, an OTP has been sent." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry }
    });

    const { sendOTPEmail } = await import("@/lib/mail/resend");

    if (!process.env.RESEND_API_KEY) {
      logger.info(`[AUTH] Generated OTP for ${user.email}: ${otp}`);
    }

    try {
      await sendOTPEmail(user.email, otp);
    } catch (mailError) {
      logger.error("Failed to send OTP email", { error: mailError, userId: user.id });
      return NextResponse.json({ message: "Failed to send OTP. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ message: "OTP sent successfully" });
  });
}
