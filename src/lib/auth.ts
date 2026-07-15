import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { verifyAccessToken, signAccessToken as jwtSignAccessToken, signRefreshToken as jwtSignRefreshToken } from "./jwt";

export * from "./jwt";

export const signAccessToken = (payload: { userId: string; role: string }) => {
  return jwtSignAccessToken(payload);
};

export const signRefreshToken = (payload: { userId: string; role: string }) => {
  return jwtSignRefreshToken(payload);
};

/**
 * Password Helpers
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * NextAuth-like compatibility layer
 */
export const authOptions: any = {};

export const auth = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return null;

    const payload = await verifyAccessToken(token);
    if (!payload) return null;
    return {
      user: {
        ...payload,
        id: payload.userId, // Ensure id is also present
        email: (payload as any).email || null
      }
    };
  } catch {
    return null;
  }
};

/**
 * Returns authenticated user payload from
 * Authorization header or accessToken cookie.
 */
export const getAuthPayload = async (req?: Request) => {
  let token = req?.headers.get("authorization")?.split(" ")[1];

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("accessToken")?.value;
  }

  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
};
