import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from "../src/lib/prisma";
import { getIoRedis, getRedis } from "../src/lib/redis";
import { meiliClient } from "../src/lib/meilisearch";

async function check() {
  console.log("Checking DB...");
  try { await prisma.$queryRaw`SELECT 1`; console.log("DB OK"); } catch (e) { console.error("DB FAIL", e); }

  console.log("Checking Redis (REST)...");
  try { const r = getRedis(); if (r) { await r.ping(); console.log("Redis REST OK"); } else console.log("Redis REST SKIP"); } catch (e) { console.error("Redis REST FAIL", e); }

  console.log("Checking Redis (io)...");
  try { const r = getIoRedis(); if (r) { await r.ping(); console.log("Redis io OK"); } else console.log("Redis io SKIP"); } catch (e) { console.error("Redis io FAIL", e); }

  console.log("Checking Meilisearch...");
  try { if (meiliClient) { await meiliClient.health(); console.log("Meili OK"); } else console.log("Meili SKIP"); } catch (e) { console.error("Meili FAIL", e); }
}

check().then(() => process.exit(0));
