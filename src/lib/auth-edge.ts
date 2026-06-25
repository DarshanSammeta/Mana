import { jwtVerify } from "jose";

const JWT_ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || "access-secret"
);

export const verifyAccessToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, JWT_ACCESS_SECRET);
    return payload as { userId: string; role: string };
  } catch (error) {
    return null;
  }
};
