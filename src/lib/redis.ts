import Redis from "ioredis";
import { observability } from "./observability";
import { REDIS_CONFIG } from "@/config/redis";

/**
 * REDIS IMPLEMENTATION FOR VERCEL + UPSTASH
 *
 * Fixes for:
 * - Error: connect ETIMEDOUT (Increased timeouts)
 * - Stream isn't writeable (Better error handling + retry strategy)
 * - Reached the max retries per request limit (Corrected maxRetriesPerRequest)
 */

declare global {
  var redis: Redis | undefined;
}

const isRedisEnabled = REDIS_CONFIG.enabled && !!REDIS_CONFIG.url;
const redisUrl = REDIS_CONFIG.url;

// Tracks if we should skip Redis calls temporarily due to persistent failures
let redisConnectionFailed = false;

// Singleton pattern for Redis client
function getRedisInstance(): Redis {
  if (!isRedisEnabled) {
    return {} as Redis;
  }

  if (global.redis) {
    return global.redis;
  }

  const client = new Redis(redisUrl, {
    // Connection settings optimized for Serverless + Upstash
    lazyConnect: true, // Don't connect until needed
    enableOfflineQueue: false, // Fail fast if connection is down

    // Fix: ioredis recommends setting maxRetriesPerRequest to null
    // when using a queue or if we want to handle failures manually.
    // Setting to 0 can cause "Reached the max retries..." errors during reconnects.
    maxRetriesPerRequest: null,

    // Timeout settings (Higher for remote Upstash connection)
    connectTimeout: 10000, // 10s
    commandTimeout: 3000,  // 3s

    // Keep alive to prevent stale connections in pool
    keepAlive: 1000,

    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);

      // Stop retrying after 5 attempts to prevent blocking serverless function
      if (times > 5) {
        console.error("[Redis] Max reconnection attempts reached.");
        redisConnectionFailed = true;
        return null; // stop retrying
      }
      return delay;
    },

    reconnectOnError(err) {
      const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
      if (targetErrors.some(e => err.message.includes(e))) {
        return true; // reconnect
      }
      return false;
    },
  });

  // Event Listeners for Auditing/Debugging
  client.on("connect", () => {
    console.log("[Redis] Attempting to connect...");
  });

  client.on("ready", () => {
    console.log("[Redis] Client ready and connected");
    redisConnectionFailed = false;
  });

  client.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
    if (err.message.includes("ECONNREFUSED") || err.message.includes("ETIMEDOUT")) {
      redisConnectionFailed = true;
    }
  });

  client.on("reconnecting", (delay) => {
    console.warn(`[Redis] Reconnecting in ${delay}ms...`);
  });

  client.on("end", () => {
    console.warn("[Redis] Connection closed");
    redisConnectionFailed = true;
  });

  if (process.env.NODE_ENV !== "production") {
    global.redis = client;
  }

  return client;
}

export const redis = getRedisInstance();

/**
 * Ensures Redis is connected before executing a command.
 * Optimized for serverless environments.
 */
async function ensureConnection(): Promise<boolean> {
  if (!isRedisEnabled || redisConnectionFailed) return false;

  if (redis.status === "ready") {
    return true;
  }

  if (redis.status === "connecting" || redis.status === "reconnecting") {
    // Wait briefly for existing connection attempt
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 2000);
      redis.once("ready", () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
  }

  try {
    await redis.connect();
    return true;
  } catch (err) {
    console.error("[Redis] Failed to establish connection:", (err as Error).message);
    redisConnectionFailed = true;
    return false;
  }
}

/**
 * Core wrapper to execute Redis commands safely.
 * Returns null on failure instead of throwing, allowing the app to fall back.
 */
async function executeRedis<T>(
  command: string,
  fn: () => Promise<T>
): Promise<T | null> {
  if (!isRedisEnabled || redisConnectionFailed) return null;

  try {
    observability.trackRedis(command);

    const isConnected = await ensureConnection();
    if (!isConnected) return null;

    // Use a race to ensure commands don't hang serverless functions indefinitely
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 3500)
    );

    const result = await Promise.race([fn(), timeout]);
    return result as T;
  } catch (err) {
    const error = err as Error;
    console.warn(`[Redis] Command ${command} failed:`, error.message);

    // If we hit connection issues during execution, trip the circuit breaker
    if (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('stream isn\'t writeable') ||
      error.message.includes('Connection is closed')
    ) {
      redisConnectionFailed = true;
      // Reset after a delay (e.g., 30s) to allow for temporary outages
      setTimeout(() => { redisConnectionFailed = false; }, 30000);
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
  const result = await executeRedis("get", () => redis.get(key));
  if (!result) return null;

  try {
    return JSON.parse(result) as T;
  } catch {
    return null;
  }
}

export async function setCachedData(
  key: string,
  value: any,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  const result = await executeRedis("set", () =>
    redis.set(key, JSON.stringify(value), "EX", ttl)
  );
  return result === "OK";
}

export async function incrementCounter(key: string): Promise<number | null> {
  const result = await executeRedis("incr", () => redis.incr(key));
  if (result === null) return null;
  return typeof result === 'number' ? result : parseInt(result as string, 10);
}

export async function expireKey(key: string, seconds: number): Promise<boolean> {
  const result = await executeRedis("expire", () => redis.expire(key, seconds));
  return result === 1;
}

export async function getTTL(key: string): Promise<number | null> {
  return await executeRedis("ttl", () => redis.ttl(key));
}

export async function deleteCache(key: string): Promise<boolean> {
  const result = await executeRedis("del", () => redis.del(key));
  return !!result;
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const keys = await executeRedis("keys", () => redis.keys(pattern));
  if (keys && keys.length > 0) {
    await executeRedis("del", () => redis.del(...keys));
  }
}

export async function zRevRange(key: string, start: number, stop: number): Promise<string[] | null> {
  return await executeRedis("zrevrange", () => redis.zrevrange(key, start, stop));
}

export async function zIncrBy(key: string, increment: number, member: string): Promise<string | null> {
  return await executeRedis("zincrby", () => redis.zincrby(key, increment, member));
}

export async function geoAdd(key: string, lng: number, lat: number, member: string): Promise<number | null> {
  return await executeRedis("geoadd", () => redis.geoadd(key, lng, lat, member));
}

// Export a safe proxy-like object for all Redis needs
export const safeRedis = {
  get: getCachedData,
  set: setCachedData,
  incr: incrementCounter,
  expire: expireKey,
  ttl: getTTL,
  del: deleteCache,
  keys: (pattern: string) => executeRedis("keys", () => redis.keys(pattern)),
  zrevrange: zRevRange,
  zincrby: zIncrBy,
  geoadd: geoAdd,
};
