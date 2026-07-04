export const MEILISEARCH_CONFIG = {
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY,
  indexes: {
    vendors: 'vendors',
    services: 'services',
  },
};
