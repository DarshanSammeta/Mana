import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  const accessToken = cookieStore.get("accessToken")?.value;

  if (refreshToken) {
    await prisma.refreshtoken.deleteMany({
      where: { token: refreshToken },
    });
  }

  const response = NextResponse.json({ message: "Logged out successfully" });

  response.cookies.set("accessToken", "", { maxAge: 0, path: "/" });
  response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });

  return response;
}
