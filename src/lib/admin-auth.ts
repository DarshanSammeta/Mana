import { verifyAccessToken } from "./auth";
import { NextResponse } from "next/server";

/**
 * Server-side helper to verify if the requesting user is an ADMIN.
 * To be used inside API routes (Node.js runtime).
 */
export async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;

  return payload;
}

/**
 * Returns a 403 Forbidden response if the user is not an admin.
 */
export function forbiddenResponse() {
  return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
}
