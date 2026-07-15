import jwt from "jsonwebtoken";
import { AUTH_CONFIG } from "@/config/auth-pages";

const JWT_ACCESS_SECRET = AUTH_CONFIG.jwtAccessSecret;
const JWT_REFRESH_SECRET = AUTH_CONFIG.jwtRefreshSecret;

export const signAccessToken = (payload: { userId: string; role: string }) => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: AUTH_CONFIG.accessTokenExpiresIn as any });
};

export const signRefreshToken = (payload: { userId: string; role: string }) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: AUTH_CONFIG.refreshTokenExpiresIn as any });
};

export const jwtSignRefreshToken = signRefreshToken;

export const generateAccessToken = (userId: string, role: string) => {
  return signAccessToken({ userId, role });
};

export const generateRefreshToken = (userId: string) => {
  return signRefreshToken({ userId, role: "" }); // Fallback
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string; role: string; id: string };
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    return null;
  }
};
