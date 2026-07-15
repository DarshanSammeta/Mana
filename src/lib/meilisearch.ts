import * as MeiliSearchModule from 'meilisearch';
import { MEILISEARCH_CONFIG } from "@/config/meilisearch";

let _meiliClient: any = null;

const getMeiliSearchConstructor = () => {
  const ms = MeiliSearchModule as any;
  const Constructor =
    ms.Meilisearch ||
    ms.MeiliSearch ||
    ms.default?.Meilisearch ||
    ms.default?.MeiliSearch ||
    (typeof ms.default === 'function' ? ms.default : null) ||
    (typeof ms === 'function' ? ms : null);

  return typeof Constructor === 'function' ? Constructor : null;
};

export function getMeiliSearch() {
  if (typeof window !== "undefined") return null;

  const host = MEILISEARCH_CONFIG.host;
  const apiKey = MEILISEARCH_CONFIG.apiKey;

  if (!host) {
    return null;
  }

  if (!_meiliClient) {
    const Constructor = getMeiliSearchConstructor();
    if (Constructor) {
      _meiliClient = new (Constructor as any)({
        host,
        apiKey,
      });
    }
  }

  return _meiliClient;
}

export const meiliClient = getMeiliSearch();

export const VENDORS_INDEX = MEILISEARCH_CONFIG.indexes.vendors;
export const SERVICES_INDEX = MEILISEARCH_CONFIG.indexes.services;

export const initMeilisearch = async () => {
  const client = getMeiliSearch();
  if (!client) return;
  try {
    await client.createIndex(VENDORS_INDEX, { primaryKey: 'id' });
    await client.createIndex(SERVICES_INDEX, { primaryKey: 'id' });

    const vendorIndex = client.index(VENDORS_INDEX);
    await vendorIndex.updateSettings({
      searchableAttributes: [
        'businessName',
        'serviceTypes',
        'categories',
        'city',
        'state',
        'description'
      ],
      filterableAttributes: [
        'city',
        'state',
        'rating',
        'verificationStatus',
        'categories',
        'serviceTypes',
        'searchScore',
        'totalBookings'
      ],
      sortableAttributes: [
        'rating',
        'totalBookings',
        'searchScore',
        'createdAt'
      ],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'searchScore:desc',
        'rating:desc',
        'totalBookings:desc'
      ],
      stopWords: ['the', 'a', 'an', 'in', 'and', 'or', 'for', 'with', 'at', 'by', 'from'],
      synonyms: {
        'photographer': ['photography', 'photoshoot', 'cameraman'],
        'decorator': ['decoration', 'decor', 'stage decor'],
        'venue': ['banquet hall', 'marriage hall', 'convention center'],
        'makeup': ['make up', 'mua', 'bridal makeup'],
        'catering': ['caterer', 'food service', 'cook']
      }
    });
    console.log('Meilisearch initialized with fine-tuned settings');
  } catch (error) {
    console.error('Meilisearch init failed:', error);
  }
};
