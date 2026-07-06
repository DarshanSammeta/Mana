export const REDIS_CONFIG = {
  // Upstash Redis URL from environment variables
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  ttl: {
    short: 60 * 5, // 5 minutes
    medium: 60 * 60, // 1 hour
    long: 60 * 60 * 24, // 24 hours
  },
  // Redis is enabled if URL is provided or if we're in development
  enabled: !!process.env.REDIS_URL || process.env.NODE_ENV !== 'production',
};
