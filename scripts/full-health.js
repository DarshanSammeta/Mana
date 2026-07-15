const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const { MeiliSearch } = require('meilisearch');
require('dotenv').config();

async function check() {
  console.log("--- Health Audit ---");

  // DB
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database: Connected");
  } catch (e) {
    console.error("❌ Database: Failed", e.message);
  } finally {
    await prisma.$disconnect();
  }

  // Redis (ioredis)
  if (process.env.REDIS_URL) {
    try {
      const redis = new Redis(process.env.REDIS_URL);
      const pong = await redis.ping();
      console.log("✅ Redis (ioredis):", pong);
      redis.disconnect();
    } catch (e) {
      console.error("❌ Redis (ioredis): Failed", e.message);
    }
  } else {
    console.log("⚠️ Redis (ioredis): REDIS_URL not set, skipping");
  }

  // Upstash Redis (REST)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
      });
      const data = await response.json();
      console.log("✅ Upstash Redis (REST):", data.result === "PONG" ? "OK" : data.result);
    } catch (e) {
      console.error("❌ Upstash Redis (REST): Failed", e.message);
    }
  } else {
    console.log("⚠️ Upstash Redis (REST): Credentials not set, skipping");
  }

  // Meilisearch
  if (process.env.NEXT_PUBLIC_MEILI_HOST && process.env.MEILI_MASTER_KEY) {
    try {
      const client = new MeiliSearch({
        host: process.env.NEXT_PUBLIC_MEILI_HOST,
        apiKey: process.env.MEILI_MASTER_KEY,
      });
      const health = await client.health();
      console.log("✅ Meilisearch:", health.status);
    } catch (e) {
      console.error("❌ Meilisearch: Failed", e.message);
    }
  } else {
    console.log("⚠️ Meilisearch: Host/Key not set, skipping");
  }

  console.log("--- Audit Complete ---");
}

check();
