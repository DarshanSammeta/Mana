import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret";

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hashed: string) => {
  return await bcrypt.compare(password, hashed);
};

export const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_ACCESS_SECRET, { expiresIn: "1h" });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string; role: string };
  } catch (error) {
    return null;
  }
};

export const getAuthPayload = async (req: Request) => {
  // 1. Check Authorization Header
  let token = req.headers.get("authorization")?.split(" ")[1];

  // 2. Check Cookie if header is missing
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
  } catch (error) {
    return null;
  }
};
