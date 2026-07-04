import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { AUTH_CONFIG } from "@/config/auth";

const JWT_ACCESS_SECRET = AUTH_CONFIG.jwtAccessSecret;
const JWT_REFRESH_SECRET = AUTH_CONFIG.jwtRefreshSecret;

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, AUTH_CONFIG.passwordSaltRounds);
};

export const comparePassword = async (password: string, hashed: string) => {
  return await bcrypt.compare(password, hashed);
};

export const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_ACCESS_SECRET, { expiresIn: AUTH_CONFIG.accessTokenExpiresIn as any });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: AUTH_CONFIG.refreshTokenExpiresIn as any });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
};

export const getAuthPayload = async (req?: Request) => {
  // 1. Check Authorization Header if req is provided
  let token = req?.headers.get("authorization")?.split(" ")[1];

  // 2. Check Cookie if header is missing or req is not provided
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("accessToken")?.value;
  }

  if (!token) return null;
  return verifyAccessToken(token);
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    return null;
  }
};
