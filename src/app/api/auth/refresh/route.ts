import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withErrorHandler } from "@/lib/error-handler";
import { SessionService } from "@/services/server/session.service";

export async function POST(_req: Request) {
  return withErrorHandler(async () => {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token missing" }, { status: 401 });
    }

    const result = await SessionService.refreshSession(refreshToken);

    if (!result) {
      return NextResponse.json({ message: "Invalid or expired refresh token" }, { status: 401 });
    }

    const { accessToken } = result;

    const response = NextResponse.json({
      accessToken: accessToken,
    });

    return SessionService.setSessionCookies(response, accessToken);

    return response;
  }, _req);
}
