import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, generateAccessToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function POST(_req: Request) {
  return withErrorHandler(async () => {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token missing" }, { status: 401 });
    }

    const dbToken = await prisma.refreshtoken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!dbToken || dbToken.expiryDate < new Date()) {
      if (dbToken) {
        await prisma.refreshtoken.delete({ where: { id: dbToken.id } });
        logger.info("Deleted expired refresh token", { userId: dbToken.userId });
      }
      return NextResponse.json({ message: "Invalid or expired refresh token" }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload || payload.userId !== dbToken.userId) {
      logger.warn("Refresh token payload mismatch", { userId: dbToken.userId });
      return NextResponse.json({ message: "Invalid refresh token" }, { status: 401 });
    }

    const newAccessToken = generateAccessToken(dbToken.userId, dbToken.user.role);

    logger.info("Access token refreshed", { userId: dbToken.userId });

    const response = NextResponse.json({
      accessToken: newAccessToken,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
    };

    response.cookies.set("accessToken", newAccessToken, { ...cookieOptions, maxAge: 15 * 60 });

    return response;
  });
}
