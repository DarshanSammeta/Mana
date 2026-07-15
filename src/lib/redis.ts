import { Redis } from "@upstash/redis";
import { Redis as IoRedis } from "ioredis";
import { observability } from "./observability";
import { REDIS_CONFIG } from "@/config/redis";

/**
 * REDIS IMPLEMENTATION FOR VERCEL + UPSTASH (REST API)
 */

let redisInstance: Redis | null = null;
let ioRedisInstance: IoRedis | null = null;

export function getRedis() {
  if (typeof window !== "undefined") return null;
  if (!REDIS_CONFIG.enabled) return null;

  if (!redisInstance) {
    redisInstance = new Redis({
      url: REDIS_CONFIG.restUrl!,
      token: REDIS_CONFIG.restToken!,
    });
  }
  return redisInstance;
}

/**
 * Standard Redis client (ioredis) for BullMQ and distributed locks
 */
export function getIoRedis() {
  if (typeof window !== "undefined") return null;

  if (!ioRedisInstance) {
    ioRedisInstance = new IoRedis(REDIS_CONFIG.connectionUri, {
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }
  return ioRedisInstance;
}

const _isRedisEnabled = REDIS_CONFIG.enabled;

// Circuit breaker flag
let redisCircuitOpen = false;

async function executeRedis<T>(
  command: string,
  fn: (client: Redis) => Promise<T>
): Promise<T | null> {
  const client = getRedis();
  if (!client || redisCircuitOpen) return null;

  try {
    observability.trackRedis(command);

    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 4000)
    );

    const result = await Promise.race([fn(client), timeout]);
    return result as T;
  } catch (err) {
    const error = err as Error;
    console.error(`[Redis REST] Command ${command} failed:`, error.message);

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
  const result = await executeRedis("get", (client) => client.get<string>(key));
  if (!result) return null;

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
  const result = await executeRedis("set", (client) =>
    client.set(key, JSON.stringify(value), { ex: ttl })
  );
  return result === "OK";
}

export async function incrementCounter(key: string): Promise<number | null> {
  return await executeRedis("incr", (client) => client.incr(key));
}

export async function expireKey(key: string, seconds: number): Promise<boolean> {
  const result = await executeRedis("expire", (client) => client.expire(key, seconds));
  return result === 1;
}

export async function getTTL(key: string): Promise<number | null> {
  return await executeRedis("ttl", (client) => client.ttl(key));
}

export async function deleteCache(key: string): Promise<boolean> {
  const result = await executeRedis("del", (client) => client.del(key));
  return typeof result === 'number' && result > 0;
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  const keys = await executeRedis("keys", (client) => client.keys(pattern));
  if (keys && Array.isArray(keys) && keys.length > 0) {
    await executeRedis("del", (client) => client.del(...keys));
  }
}

export async function zRevRange(key: string, start: number, stop: number): Promise<string[] | null> {
  return await executeRedis("zrange", (client) => client.zrange<string[]>(key, start, stop, { rev: true }));
}

export async function zIncrBy(key: string, increment: number, member: string): Promise<number | null> {
  return await executeRedis("zincrby", (client) => client.zincrby(key, increment, member));
}

export async function geoAdd(key: string, lng: number, lat: number, member: string): Promise<number | null> {
  return await executeRedis("geoadd", (client) => client.geoadd(key, { longitude: lng, latitude: lat, member }));
}

export async function geoSearch(
  key: string,
  lng: number,
  lat: number,
  radius: number,
  unit: 'm' | 'km' | 'ft' | 'mi' = 'km'
): Promise<string[] | null> {
  const result = await executeRedis("geosearch", (client: any) =>
    client.geosearch(key, "FROMLONLAT", lng, lat, "BYRADIUS", radius, unit)
  );
  if (!result || !Array.isArray(result)) return null;
  return result.map(m => typeof m === 'string' ? m : (m as any).member as string);
}

/**
 * Update vendor's real-time location in Redis for matching
 */
export async function updateVendorLocation(vendorId: string, lng: number, lat: number) {
  const ioRedis = getIoRedis();
  if (ioRedis) {
    // Standard ioredis uses GEOADD
    await ioRedis.geoadd("vendors:locations", lng, lat, vendorId);
    // Also set a presence key to know they are "online"
    await ioRedis.set(`vendor:online:${vendorId}`, "true", "EX", 300); // 5 mins expiry
  }
}

export async function getNearbyVendors(lng: number, lat: number, radiusKm: number): Promise<string[]> {
  const ioRedis = getIoRedis();
  if (!ioRedis) return [];

  // ioredis GEORADIUS or GEOSEARCH
  // ioredis version >= 6.2 supports GEOSEARCH
  try {
    const results = await (ioRedis as any).geosearch(
      "vendors:locations",
      "FROMLONLAT",
      lng,
      lat,
      "BYRADIUS",
      radiusKm,
      "km",
      "WITHDIST"
    );
    // results format: [[member, distance], ...]
    if (!results || !Array.isArray(results)) return [];
    return results.map((r: any) => r[0]);
  } catch {
    // Fallback to GEORADIUS if GEOSEARCH fails
    const results = await ioRedis.georadius("vendors:locations", lng, lat, radiusKm, "km");
    return results as string[];
  }
}

export async function llen(key: string): Promise<number> {
  const result = await executeRedis("llen", (client) => client.llen(key));
  return typeof result === 'number' ? result : 0;
}

export async function zcard(key: string): Promise<number> {
  const result = await executeRedis("zcard", (client) => client.zcard(key));
  return typeof result === 'number' ? result : 0;
}

export async function sCard(key: string): Promise<number> {
  const result = await executeRedis("scard", (client) => client.scard(key));
  return typeof result === 'number' ? result : 0;
}

export async function ping(): Promise<boolean> {
  const result = await executeRedis("ping", (client) => client.ping());
  return result === "PONG" || result === "OK";
}

// Export a safe proxy-like object for all Redis needs
export const safeRedis = {
  get: getCachedData,
  set: setCachedData,
  incr: incrementCounter,
  expire: expireKey,
  ttl: getTTL,
  del: deleteCache,
  keys: async (pattern: string) => {
    const client = getRedis();
    const result = client ? await executeRedis("keys", (c) => c.keys(pattern)) : null;
    return result || [];
  },
  zrevrange: zRevRange,
  zincrby: zIncrBy,
  geoadd: geoAdd,
  scard: sCard,
  llen: llen,
  zcard: zcard,
  ping: ping,
  pipeline: () => {
    const client = getRedis();
    if (!client) {
      return {
        get: () => {},
        exec: async () => []
      };
    }
    return client.pipeline();
  }
};

export const redis = safeRedis;
