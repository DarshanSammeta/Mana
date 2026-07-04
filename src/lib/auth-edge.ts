import { jwtVerify } from "jose";

import { AUTH_CONFIG } from "@/config/auth";

const JWT_ACCESS_SECRET = new TextEncoder().encode(
  AUTH_CONFIG.jwtAccessSecret
);

export const verifyAccessToken = async (token: string) => {
  try {
    if (!token) {
      console.error("[Auth-Edge] No token provided to verify");
      return null;
    }
    const { payload } = await jwtVerify(token, JWT_ACCESS_SECRET);
    return payload as { userId: string; role: string };
  } catch (error: any) {
    console.error("[Auth-Edge] Token verification failed:", error.message || error);
    return null;
  }
};
