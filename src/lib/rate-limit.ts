import { redis } from './redis';
import { NextResponse } from 'next/server';

export interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
}

export async function rateLimit(identifier: string, config: RateLimitConfig = { limit: 10, window: 60 }) {
  const key = `ratelimit:${identifier}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, config.window);
  }

  const remaining = Math.max(0, config.limit - current);
  const reset = await redis.ttl(key);

  return {
    success: current <= config.limit,
    limit: config.limit,
    remaining,
    reset,
  };
}

export function rateLimitResponse() {
  return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
