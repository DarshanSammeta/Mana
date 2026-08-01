import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { SessionService } from "@/services/server/session.service";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // Revoke ALL sessions for this user
    await SessionService.revokeAllUserSessions(payload.userId);

    logger.info(`User ${payload.userId} revoked all sessions via API`);

    // Prepare response to clear current session cookies too
    const response = NextResponse.json({ message: "All sessions revoked" });

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
  }, req);
}
