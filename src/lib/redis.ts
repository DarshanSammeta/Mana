import { Redis } from "@upstash/redis";
import { observability } from "./observability";
import { REDIS_CONFIG } from "@/config/redis";

/**
 * REDIS IMPLEMENTATION FOR VERCEL + UPSTASH (REST API)
 *
 * Switched from ioredis (TCP) to @upstash/redis (REST) to:
 * - Avoid "Stream isn't writeable" errors in serverless
 * - Support Vercel's REST-based environment variables
 * - Simplify connection management (stateless)
 */

// Initialize the Redis client using REST credentials
export const redis = REDIS_CONFIG.enabled
  ? new Redis({
      url: REDIS_CONFIG.restUrl!,
      token: REDIS_CONFIG.restToken!,
    })
  : null;

const isRedisEnabled = REDIS_CONFIG.enabled && !!redis;

// Circuit breaker flag (simulated for REST)
let redisCircuitOpen = false;

/**
 * Core wrapper to execute Redis commands safely via REST.
 */
async function executeRedis<T>(
  command: string,
  fn: () => Promise<T>
): Promise<T | null> {
  if (!isRedisEnabled || redisCircuitOpen) return null;

  try {
    observability.trackRedis(command);

    // REST calls are stateless, no need for ensureConnection()

    // Use a race to ensure commands don't hang serverless functions indefinitely
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 4000)
    );

    const result = await Promise.race([fn(), timeout]);
    return result as T;
  } catch (err) {
    const error = err as Error;
    console.error(`[Redis REST] Command ${command} failed:`, error.message);

    // If we hit persistent network issues, trip the circuit breaker briefly
    if (error.message.includes('fetch') || error.message.includes('network')) {
      redisCircuitOpen = true;
      setTimeout(() => { redisCircuitOpen = false; }, 10000); // 10s cooldown
    }

    return null;
  }
}

export const CACHE_TTL = {
  SHORT: REDIS_CONFIG.ttl.short,
  MEDIUM: REDIS_CONFIG.ttl.medium,
  LONG: REDIS_CONFIG.ttl.long,
};

// --- Safe Wrapper Methods ---

export async function getCachedData<T>(key: string): Promise<T | null> {
  const result = await executeRedis("get", () => redis!.get<string>(key));
  if (!result) return null;

  // @upstash/redis might return the object directly if it was stored as JSON
  if (typeof result !== 'string') return result as T;

  try {
    return JSON.parse(result) as T;
  } catch {
    return result as unknown as T;
  }
}

export async function setCachedData(
  key: string,
  value: any,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  const result = await executeRedis("set", () =>
    redis!.set(key, JSON.stringify(value), { ex: ttl })
  );
  return result === "OK";
}

export async function incrementCounter(key: string): Promise<number | null> {
  return await executeRedis("incr", () => redis!.incr(key));
}

export async function expireKey(key: string, seconds: number): Promise<boolean> {
  const result = await executeRedis("expire", () => redis!.expire(key, seconds));
  return result === 1;
}

export async function getTTL(key: string): Promise<number | null> {
  return await executeRedis("ttl", () => redis!.ttl(key));
}

export async function deleteCache(key: string): Promise<boolean> {
  const result = await executeRedis("del", () => redis!.del(key));
  return typeof result === 'number' && result > 0;
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const keys = await executeRedis("keys", () => redis!.keys(pattern));
  if (keys && Array.isArray(keys) && keys.length > 0) {
    await executeRedis("del", () => redis!.del(...keys));
  }
}

export async function zRevRange(key: string, start: number, stop: number): Promise<string[] | null> {
  return await executeRedis("zrange", () => redis!.zrange<string[]>(key, start, stop, { rev: true }));
}

export async function zIncrBy(key: string, increment: number, member: string): Promise<number | null> {
  return await executeRedis("zincrby", () => redis!.zincrby(key, increment, member));
}

export async function geoAdd(key: string, lng: number, lat: number, member: string): Promise<number | null> {
  return await executeRedis("geoadd", () => redis!.geoadd(key, { longitude: lng, latitude: lat, member }));
}

// Export a safe proxy-like object for all Redis needs
export const safeRedis = {
  get: getCachedData,
  set: setCachedData,
  incr: incrementCounter,
  expire: expireKey,
  ttl: getTTL,
  del: deleteCache,
  keys: (pattern: string) => executeRedis("keys", () => redis!.keys(pattern)),
  zrevrange: zRevRange,
  zincrby: zIncrBy,
  geoadd: geoAdd,
};
