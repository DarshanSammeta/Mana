import { safeRedis } from './redis';
import { NextResponse } from 'next/server';

export interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
}

export async function rateLimit(identifier: string, config: RateLimitConfig = { limit: 10, window: 60 }) {
  const key = `ratelimit:${identifier}`;

  // Use safeRedis wrapper to avoid throwing errors if Redis is down
  const current = await safeRedis.incr(key);

  // If Redis is down, current will be null.
  // We treat null as "success" to ensure the app stays functional.
  if (current === null) {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: config.window,
      redisOffline: true
    };
  }

  if (current === 1) {
    await safeRedis.expire(key, config.window);
  }

  const remaining = Math.max(0, config.limit - current);
  const reset = await safeRedis.ttl(key) || config.window;

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
