export const REDIS_CONFIG = {
  // Upstash Redis REST configuration
  restUrl: process.env.UPSTASH_REDIS_REST_URL,
  restToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  ttl: {
    short: 60 * 5, // 5 minutes
    medium: 60 * 60, // 1 hour
    long: 60 * 60 * 24, // 24 hours
  },
  // Redis is enabled if REST URL and Token are provided
  enabled: !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN,
};
