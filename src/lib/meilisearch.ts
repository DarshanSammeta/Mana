import * as MeiliSearchModule from 'meilisearch';

import { MEILISEARCH_CONFIG } from "@/config/meilisearch";

const host = MEILISEARCH_CONFIG.host;
const apiKey = MEILISEARCH_CONFIG.apiKey;

/**
 * Next.js 15 / RSC Resilient Constructor Discovery
 * Specifically handles 'Meilisearch' and 'MeiliSearch' exports.
 */
const getMeiliSearchConstructor = () => {
  const ms = MeiliSearchModule as any;

  // Try all known export patterns
  const Constructor =
    ms.Meilisearch ||
    ms.MeiliSearch ||
    ms.default?.Meilisearch ||
    ms.default?.MeiliSearch ||
    (typeof ms.default === 'function' ? ms.default : null) ||
    (typeof ms === 'function' ? ms : null);

  return typeof Constructor === 'function' ? Constructor : null;
};

const Constructor = getMeiliSearchConstructor();

if (!Constructor) {
  console.error('[Meilisearch] Failed to find constructor. Available keys:', Object.keys(MeiliSearchModule));
}

// Instantiate client if constructor found
export const meiliClient = Constructor ? new (Constructor as any)({
  host,
  apiKey,
}) : null;

export const VENDORS_INDEX = MEILISEARCH_CONFIG.indexes.vendors;
export const SERVICES_INDEX = MEILISEARCH_CONFIG.indexes.services;

export const initMeilisearch = async () => {
  if (!meiliClient) return;
  try {
    await meiliClient.createIndex(VENDORS_INDEX, { primaryKey: 'id' });
    await meiliClient.createIndex(SERVICES_INDEX, { primaryKey: 'id' });

    const vendorIndex = meiliClient.index(VENDORS_INDEX);
    await vendorIndex.updateSettings({
      searchableAttributes: ['businessName', 'description', 'city', 'state', 'categories', 'serviceTypes'],
      filterableAttributes: ['city', 'state', 'rating', 'verificationStatus', 'categories', 'serviceTypes', 'searchScore'],
      sortableAttributes: ['rating', 'totalBookings', 'searchScore', 'createdAt'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness', 'searchScore:desc', 'rating:desc'],
    });
    console.log('Meilisearch initialized');
  } catch (error) {
    console.error('Meilisearch init failed:', error);
  }
};
