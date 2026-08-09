import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withErrorHandler } from "@/lib/error-handler";
import { SessionService } from "@/services/server/session.service";
import logger from "@/lib/logger";

export async function POST(_req: Request) {
  return withErrorHandler(async () => {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (refreshToken) {
      await SessionService.revokeSession(refreshToken);
      logger.info("User logged out, session revoked");
    }

    const response = NextResponse.json({ message: "Logged out successfully" });

    const cookieOptions = {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      domain: undefined,
    };

    response.cookies.set("accessToken", "", cookieOptions);
    response.cookies.set("refreshToken", "", cookieOptions);

    return response;
  }, _req);
}
