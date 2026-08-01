import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { AUTH_CONFIG } from "@/config/auth";

const ACCESS_SECRET = new TextEncoder().encode(AUTH_CONFIG.jwtAccessSecret);
const REFRESH_SECRET = new TextEncoder().encode(AUTH_CONFIG.jwtRefreshSecret);

export interface AccessTokenPayload extends JWTPayload {
  userId: string;
  role: string;
  verificationStatus?: string;
  sessionId?: string;
  id?: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
  sessionId?: string;
  role?: string;
}

export type SessionData = AccessTokenPayload;

/**
 * Signs a new access token using the jose library.
 * Includes standard claims and ensures 'id' is present for compatibility.
 */
export const signAccessToken = async (payload: AccessTokenPayload) => {
  const data = { ...payload, id: payload.id || payload.userId };

  return await new SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(AUTH_CONFIG.accessTokenExpiresIn)
    .sign(ACCESS_SECRET);
};

/**
 * Signs a new refresh token using the jose library.
 */
export const signRefreshToken = async (payload: RefreshTokenPayload) => {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(AUTH_CONFIG.refreshTokenExpiresIn)
    .sign(REFRESH_SECRET);
};

/**
 * Verifies an access token using the jose library.
 * Explicitly enforces HS256 algorithm.
 */
export const verifyAccessToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET, {
      algorithms: ["HS256"]
    });
    return payload as AccessTokenPayload;
  } catch {
    console.warn(`[Auth-Core] Token verification failed`);
    return null;
  }
};

/**
 * Verifies a refresh token using the jose library.
 * Explicitly enforces HS256 algorithm.
 */
export const verifyRefreshToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET, {
      algorithms: ["HS256"]
    });
    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
};
