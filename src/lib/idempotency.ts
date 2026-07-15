import { safeRedis } from "./redis";
import crypto from "crypto";

export class Idempotency {
  private static PREFIX = "idempotency:";
  private static DEFAULT_TTL = 86400; // 24 hours

  /**
   * Checks if a request has been processed and stores the result if not.
   * If already processed, returns the cached result.
   */
  static async getOrSet<T>(key: string, fn: () => Promise<T>, ttl = this.DEFAULT_TTL): Promise<T> {
    const fullKey = `${this.PREFIX}${key}`;

    // 1. Check if key exists
    const cached = await safeRedis.get<string>(fullKey);
    if (cached) {
      console.log(`[Idempotency] Cache hit for key: ${key}`);
      return JSON.parse(cached);
    }

    // 2. Use a lock to prevent race conditions during execution
    const lockKey = `${fullKey}:lock`;
    const acquired = await (safeRedis as any).set(lockKey, "locked", { ex: 30, nx: true });

    if (!acquired) {
      // Wait and retry once or throw
      await new Promise(resolve => setTimeout(resolve, 1000));
      const secondCheck = await safeRedis.get<string>(fullKey);
      if (secondCheck) return JSON.parse(secondCheck);
      throw new Error("Duplicate request in progress");
    }

    try {
      const result = await fn();
      await safeRedis.set(fullKey, result, ttl);
      return result;
    } finally {
      await safeRedis.del(lockKey);
    }
  }

  /**
   * Generates an idempotency key from request data if one isn't provided.
   */
  static generateKey(userId: string, action: string, payload: any): string {
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");
    return `${userId}:${action}:${hash}`;
  }
}
