import { NextResponse } from "next/server";
import { Idempotency } from "@/lib/idempotency";
import { verifyAccessToken } from "@/lib/auth";

export async function withIdempotency(req: Request, handler: (req: Request) => Promise<NextResponse>) {
  if (req.method !== "POST" && req.method !== "PATCH") {
    return handler(req);
  }

  const idempotencyKey = req.headers.get("x-idempotency-key");
  if (!idempotencyKey) {
    return handler(req);
  }

  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return handler(req);

  const payload = verifyAccessToken(token);
  if (!payload) return handler(req);

  const cacheKey = `req:${payload.userId}:${idempotencyKey}`;

  try {
    return await Idempotency.getOrSet(cacheKey, async () => {
      const response = await handler(req);

      // Only cache successful or specific client error responses
      // Don't cache 5xx errors to allow retries
      if (response.status < 500) {
        const data = await response.clone().json();
        return {
          status: response.status,
          body: data,
          headers: Object.fromEntries(response.headers.entries())
        };
      }
      throw new Error("Internal Server Error - Not Caching");
    });
  } catch (error: any) {
    if (error.message === "Duplicate request in progress") {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    // For other errors, let the normal flow handle it
    return handler(req);
  }
}

/**
 * Helper to wrap cached response back into NextResponse
 */
export function fromCachedResponse(cached: any): NextResponse {
  return NextResponse.json(cached.body, {
    status: cached.status,
    headers: cached.headers
  });
}
