import { safeRedis } from './redis';
import logger from './logger';

export interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
}

/**
 * Simplified Rate Limiter for Pages API routes (e.g. Socket.io)
 * Fail-open design to ensure availability.
 */
export async function rateLimit(identifier: string, config: RateLimitConfig = { limit: 10, window: 60 }) {
  const key = `ratelimit:${identifier}`;

  try {
    const current = await safeRedis.incr(key);

    if (current === null) {
      logger.warn(`Rate limit check failed for ${identifier} (Pages). Failing open.`);
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
    const ttl = await safeRedis.ttl(key);
    const reset = ttl && ttl > 0 ? ttl : config.window;

    return {
      success: current <= config.limit,
      limit: config.limit,
      remaining,
      reset,
    };
  } catch (error) {
    logger.error(`Rate limit error (Pages) for ${identifier}:`, error);
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: config.window,
    };
  }
}
