import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function POST(_req: Request) {
  return withErrorHandler(async () => {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (refreshToken) {
      await prisma.refreshtoken.deleteMany({
        where: { token: refreshToken },
      });
      logger.info("User logged out, refresh token cleared");
    }

    const response = NextResponse.json({ message: "Logged out successfully" });

    const cookieOptions = {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    response.cookies.set("accessToken", "", cookieOptions);
    response.cookies.set("refreshToken", "", cookieOptions);

    return response;
  }, _req);
}
