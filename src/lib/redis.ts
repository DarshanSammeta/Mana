import Redis from 'ioredis';
import { observability } from "./observability";

import { REDIS_CONFIG } from "@/config/redis";

const redisUrl = REDIS_CONFIG.url;

const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  connectTimeout: 500, // Reduced timeout
  enableOfflineQueue: false,
  lazyConnect: true, // Don't connect immediately
  retryStrategy(times) {
    // Only retry 2 times in development, then stop
    const maxRetries = process.env.NODE_ENV === 'production' ? 5 : 1;
    if (times > maxRetries) return null;
    return Math.min(times * 50, 2000);
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

let redisDisabled = false;

// Add error listener to prevent unhandled error event crashes
redis.on('error', (err) => {
  // Silent in non-production if Redis is not running or timing out
  if (process.env.NODE_ENV !== 'production') {
    if (!redisDisabled) {
      console.warn('[Redis] Connection issues detected. Caching will be bypassed in development.');
      redisDisabled = true;
    }
    return;
  }
  console.error('[Redis] Error:', err);
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Wrap Redis calls with observability and safety
const wrapRedisCommand = (command: string, originalFn: (...args: any[]) => any) => {
  return async (...args: any[]) => {
    if (redisDisabled && process.env.NODE_ENV !== 'production') {
      return null;
    }

    try {
      observability.trackRedis(command);

      // If redis is not connected and we are in dev, fail fast
      if (process.env.NODE_ENV !== 'production' && redis.status !== 'ready' && redis.status !== 'connecting') {
        return null;
      }

      // Add a short timeout to Redis operations to prevent blocking SSR
      return await Promise.race([
        originalFn(...args),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error(`Redis ${command} timeout`)), 300))
      ]);
    } catch (error) {
      // Don't log common connection errors in dev
      if (process.env.NODE_ENV !== 'production') return null;
      console.warn(`Redis ${command} failed:`, error);
      return null;
    }
  };
};

redis.get = wrapRedisCommand("get", redis.get.bind(redis));
redis.set = wrapRedisCommand("set", redis.set.bind(redis));
redis.del = wrapRedisCommand("del", redis.del.bind(redis));
redis.keys = wrapRedisCommand("keys", redis.keys.bind(redis));

export const CACHE_TTL = {
  SHORT: REDIS_CONFIG.ttl.short,
  MEDIUM: REDIS_CONFIG.ttl.medium,
  LONG: REDIS_CONFIG.ttl.long,
};

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setCachedData(key: string, data: any, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch {
    // Fail silently - app should still work without cache
  }
}

export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
