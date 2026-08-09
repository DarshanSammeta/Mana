import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withErrorHandler } from "@/lib/error-handler";
import { SessionService } from "@/services/server/session.service";

export async function POST(_req: Request) {
  return withErrorHandler(async () => {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    // Safe diagnostic logging — never print token or cookie contents
    const cookieHeader = (_req.headers && typeof _req.headers.get === 'function') ? _req.headers.get('cookie') : undefined;
    console.log("[BACKEND REFRESH ENTRY]", {
      hasCookieHeader: Boolean(cookieHeader),
      cookieLength: cookieHeader ? cookieHeader.length : 0,
      hasRefreshToken: Boolean(refreshToken),
    });

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token missing" }, { status: 401 });
    }

    const result = await SessionService.refreshSession(refreshToken);

    if (!result) {
      return NextResponse.json({ message: "Invalid or expired refresh token" }, { status: 401 });
    }

    const { accessToken, refreshToken: newRefreshToken } = result;

    const response = NextResponse.json({
      accessToken: accessToken,
    });

    return SessionService.setSessionCookies(response, accessToken, newRefreshToken);

  }, _req);
}
