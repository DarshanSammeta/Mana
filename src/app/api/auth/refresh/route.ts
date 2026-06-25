import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, generateAccessToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
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
    }
    return NextResponse.json({ message: "Invalid or expired refresh token" }, { status: 401 });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload || payload.userId !== dbToken.userId) {
    return NextResponse.json({ message: "Invalid refresh token" }, { status: 401 });
  }

  const newAccessToken = generateAccessToken(dbToken.userId, dbToken.user.role);

  const response = NextResponse.json({
    accessToken: newAccessToken,
  });

  response.cookies.set("accessToken", newAccessToken, {
    httpOnly: true, // Security fix
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });

  return response;
}
