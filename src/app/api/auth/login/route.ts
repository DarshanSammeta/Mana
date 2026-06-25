import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!rateLimit(ip, 5, 60000)) {
    return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      await createAuditLog({ action: "LOGIN_FAILED", details: { email: validated.email }, ipAddress: ip });
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      return NextResponse.json({ message: "Account locked. Try again later." }, { status: 403 });
    }

    const isPasswordValid = await comparePassword(validated.password, user.password);
    if (!isPasswordValid) {
      const attempts = user.loginAttempts + 1;
      let lockUntil = null;
      if (attempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, lockUntil }
      });

      await createAuditLog({ userId: user.id, action: "LOGIN_FAILED", details: { email: validated.email, attempts }, ipAddress: ip });
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Reset attempts on success and create refresh token in parallel
    const [_, refreshTokenResult] = await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockUntil: null }
      }),
      prisma.refreshtoken.create({
        data: {
          id: crypto.randomUUID(),
          token: generateRefreshToken(user.id),
          userId: user.id,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
      // Fire and forget audit log to not block response
      createAuditLog({ userId: user.id, action: "LOGIN_SUCCESS", ipAddress: ip }).catch(err =>
        console.error("Audit log failed:", err)
      )
    ]);

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = refreshTokenResult.token;

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
    });

    // Set tokens in cookies
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true, // Security fix
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Better for cross-site navigation consistency
      maxAge: 15 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 400 });
  }
}
