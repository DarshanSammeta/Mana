import "server-only";
import { safeRedis } from './redis';
import logger from './logger';

export interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
  redisOffline?: boolean;
}

/**
 * Enterprise-grade rate limiter with Redis fallback
 * Uses IP + Identifier (e.g. Email) to prevent shared-IP blocking
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Generate a unique key for this identifier
  const key = `ratelimit:${identifier}`;

  // Check if we should ignore rate limits (e.g. for CI/CD or specific bypass)
  if (process.env.DISABLE_RATE_LIMITING === "true") {
    return { success: true, limit: config.limit, remaining: config.limit, reset: config.window };
  }

  try {
    // Use safeRedis wrapper to avoid throwing errors if Redis is down
    const current = await safeRedis.incr(key);

    // If Redis is down/disabled, current will be null.
    // Fail-open strategy: allow request but log warning
    if (current === null) {
      logger.warn(`Rate limit check failed for ${identifier} due to Redis unavailability. Failing open.`);
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit,
        reset: config.window,
        redisOffline: true
      };
    }

    // Set expiration on the first request in the window
    if (current === 1) {
      await safeRedis.expire(key, config.window);
    }

    const ttl = await safeRedis.ttl(key);
    const reset = ttl && ttl > 0 ? ttl : config.window;

    const success = current <= config.limit;
    const remaining = Math.max(0, config.limit - current);

    return {
      success,
      limit: config.limit,
      remaining,
      reset,
      retryAfter: success ? undefined : reset,
    };
  } catch (error) {
    logger.error(`Rate limit error for ${identifier}:`, error);
    // Fail-open
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: config.window,
    };
  }
}

/**
 * Standardized rate limit response with Retry-After header
 */
export async function rateLimitResponse(result: RateLimitResult, message?: string) {
  const { NextResponse } = await import('next/server');

  const retryAfter = result.retryAfter || result.reset || 60;

  return NextResponse.json({
    success: false,
    message: message || `Too many attempts. Please wait ${Math.ceil(retryAfter / 60)} minutes.`,
    retryAfter,
  }, {
    status: 429,
    headers: {
      "Retry-After": retryAfter.toString(),
      "Content-Type": "application/json",
    },
  });
}
