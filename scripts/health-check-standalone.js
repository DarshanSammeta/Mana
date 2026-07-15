require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Redis } = require('@upstash/redis');
const { Meilisearch } = require('meilisearch');

async function check() {
  console.log("🚀 Starting Standalone Health Check...");

  // 1. Prisma Check
  console.log("\n📡 Checking Database (Prisma)...");
  const prisma = new PrismaClient();
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ DB OK (took ${Date.now() - start}ms)`);
  } catch (e) {
    console.error("❌ DB FAIL:", e.message);
  } finally {
    await prisma.$disconnect();
  }

  // 2. Upstash Redis Check
  console.log("\n🔴 Checking Upstash Redis (REST)...");
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    try {
      const start = Date.now();
      const res = await redis.ping();
      console.log(`✅ Redis OK (${res}, took ${Date.now() - start}ms)`);
    } catch (e) {
      console.error("❌ Redis FAIL:", e.message);
    }
  } else {
    console.warn("⏭️ Redis SKIP (Missing Upstash credentials)");
  }

  // 3. Meilisearch Check
  console.log("\n🔍 Checking Meilisearch...");
  const meiliHost = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
  const meiliKey = process.env.MEILISEARCH_API_KEY;

  if (meiliHost) {
    try {
      const client = new Meilisearch({
        host: meiliHost,
        apiKey: meiliKey,
      });
      const start = Date.now();
      const health = await client.health();
      console.log(`✅ Meili OK (Status: ${health.status}, took ${Date.now() - start}ms)`);
    } catch (e) {
      console.error(`❌ Meili FAIL: ${e.message} (Host: ${meiliHost})`);
    }
  } else {
    console.log("⏭️ Meili SKIP (No host configured)");
  }

  console.log("\n🏁 Health check complete.");
}

check().then(() => process.exit(0)).catch(err => {
  console.error("Fatal error during health check:", err);
  process.exit(1);
});
