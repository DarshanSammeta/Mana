import * as dotenv from "dotenv";
dotenv.config();
import { getRedis } from "../src/lib/redis";
import { getMeiliSearch, VENDORS_INDEX } from "../src/lib/meilisearch";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- INFRASTRUCTURE LATENCY BASELINE ---");

  // 1. Redis Latency
  const redis = getRedis();
  if (redis) {
    const start = performance.now();
    await redis.ping();
    console.log(`Redis Ping: ${(performance.now() - start).toFixed(2)}ms`);

    const startSet = performance.now();
    await redis.set("bench-test", "val");
    console.log(`Redis Set: ${(performance.now() - startSet).toFixed(2)}ms`);

    const startGet = performance.now();
    await redis.get("bench-test");
    console.log(`Redis Get: ${(performance.now() - startGet).toFixed(2)}ms`);
  } else {
    console.log("Redis: Disabled or not configured.");
  }

  // 2. Meilisearch Latency
  const meili = getMeiliSearch();
  if (meili) {
    try {
        const start = performance.now();
        await meili.health();
        console.log(`Meilisearch Health: ${(performance.now() - start).toFixed(2)}ms`);

        const index = meili.index(VENDORS_INDEX);
        const startSearch = performance.now();
        await index.search("wedding", { limit: 1 });
        console.log(`Meilisearch Search: ${(performance.now() - startSearch).toFixed(2)}ms`);
    } catch (e: any) {
        console.log(`Meilisearch: Error - ${e.message}`);
    }
  } else {
    console.log("Meilisearch: Disabled or not configured.");
  }

  // 3. Database Latency
  const startDb = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  console.log(`DB Connection (SELECT 1): ${(performance.now() - startDb).toFixed(2)}ms`);

  const startDbComplex = performance.now();
  await prisma.vendorprofile.count();
  console.log(`DB Count (VendorProfile): ${(performance.now() - startDbComplex).toFixed(2)}ms`);

  console.log("---------------------------------------");
}

main().finally(() => prisma.$disconnect());
