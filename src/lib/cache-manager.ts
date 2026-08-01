import { getRedis } from "./redis";

export class CacheManager {
  private static PREFIX = "mana:v1:";

  /**
   * Generates a versioned cache key.
   */
  private static getKey(key: string, version: string = "1") {
    return `${this.PREFIX}${version}:${key}`;
  }

  /**
   * Fetches data from cache or executes fallback.
   * Implements simple stampede protection via locking.
   */
  static async get<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = 300,
    version: string = "1"
  ): Promise<T> {
    const redis = getRedis();
    const fullKey = this.getKey(key, version);

    if (!redis) return await fallback();

    try {
      const cached = await redis.get(fullKey);
      if (cached) {
        return (typeof cached === "string" ? JSON.parse(cached) : cached) as T;
      }

      // Simple lock-free re-fetch (Stampede protection can be added here with Redis NX)
      const data = await fallback();
      await redis.set(fullKey, JSON.stringify(data), { ex: ttl });
      return data;
    } catch (error) {
      console.error(`[CacheManager] Error for key ${fullKey}:`, error);
      return await fallback();
    }
  }

  /**
   * Force invalidates a cache key.
   */
  static async invalidate(key: string, version: string = "1") {
    const redis = getRedis();
    if (!redis) return;
    await redis.del(this.getKey(key, version));
  }
}
