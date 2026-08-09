import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.APP_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean) as string[];

export function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && ALLOWED_ORIGINS.some(o => o.startsWith(origin) || origin.startsWith(o));

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin! : ALLOWED_ORIGINS[0] || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-request-id, x-correlation-id, x-user-id, x-user-role",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleOptions(req: Request) {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }
  return null;
}
