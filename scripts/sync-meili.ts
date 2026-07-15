import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";
import * as MeiliSearchModule from 'meilisearch';

const prisma = new PrismaClient();

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
const MeiliConstructor = getMeiliSearchConstructor();
const meiliClient = MeiliConstructor ? new (MeiliConstructor as any)({
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY,
}) : null;

const VENDORS_INDEX = process.env.MEILISEARCH_VENDORS_INDEX || 'vendors';

async function sync() {
  if (!meiliClient) {
    console.error("Meilisearch client not initialized.");
    return;
  }

  console.log("Syncing vendors to Meilisearch...");

  const vendors = await prisma.vendorprofile.findMany({
    where: { verificationStatus: "APPROVED" },
    include: {
        user: true,
        service: {
            include: {
                servicetype: {
                    include: {
                        subcategory: {
                            include: {
                                category: true
                            }
                        }
                    }
                }
            }
        }
    }
  });

  const documents = vendors.map(v => ({
    id: v.id,
    businessName: v.businessName,
    city: v.city,
    rating: v.rating,
    reviewCount: v.reviewCount,
    categories: Array.from(new Set(v.service.map(s => s.servicetype.subcategory.category.name))),
    services: v.service.map(s => s.title),
    description: v.description
  }));

  const index = meiliClient.index(VENDORS_INDEX);

  console.log(`Uploading ${documents.length} documents...`);
  const task = await index.addDocuments(documents);
  console.log("Task submitted:", task.taskUid);

  console.log("Configuring index settings...");
  await index.updateSettings({
    filterableAttributes: ['city', 'rating', 'categories'],
    sortableAttributes: ['rating', 'reviewCount'],
    searchableAttributes: ['businessName', 'description', 'categories', 'services', 'city']
  });

  console.log("✅ Meilisearch sync complete.");
}

sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
