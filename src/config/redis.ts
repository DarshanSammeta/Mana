export const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  ttl: {
    short: 60 * 5, // 5 minutes
    medium: 60 * 60, // 1 hour
    long: 60 * 60 * 24, // 24 hours
  },
};
