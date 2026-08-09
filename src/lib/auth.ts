import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { verifyAccessToken as verifyAccessTokenCore, signAccessToken as signAccessTokenCore, signRefreshToken as signRefreshTokenCore } from "./auth-core";

export * from "./auth-core";

export const signAccessToken = signAccessTokenCore;
export const signRefreshToken = signRefreshTokenCore;

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "SUPPORT_ADMIN", "CONTENT_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN"];

/**
 * Verifies if the request is from an authorized Admin.
 */
export async function verifyAdminRequest(req: Request) {
  let token: string | undefined;

  // 1. Authorization header
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // 2. Fallback to accessToken cookie
  if (!token) {
    const cookieHeader = req.headers.get("cookie");

    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  if (!token) {
    return null;
  }

  const payload = await verifyAccessTokenCore(token);

  if (!payload) {
    return null;
  }

  if (!ADMIN_ROLES.includes(payload.role?.toUpperCase())) {
    return null;
  }

  return payload;
}

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

    const payload = await verifyAccessTokenCore(token);
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
    return await verifyAccessTokenCore(token);
  } catch {
    return null;
  }
};
