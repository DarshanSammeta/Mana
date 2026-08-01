import { Redis } from "@upstash/redis";
import * as dotenv from "dotenv";
dotenv.config();

const client = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function benchKeys(pattern: string) {
  const start = Date.now();
  // @ts-ignore
  const keys = await client.keys(pattern);
  const end = Date.now() - start;
  console.log(`[KEYS] Found ${keys.length} keys in ${end}ms`);
}

async function benchScan(pattern: string) {
  const start = Date.now();
  let cursor = "0";
  let total = 0;
  do {
    // @ts-ignore
    const [nextCursor, keys] = await client.scan(cursor, { match: pattern, count: 100 });
    cursor = nextCursor;
    total += keys.length;
  } while (cursor !== "0");
  const end = Date.now() - start;
  console.log(`[SCAN] Found ${total} keys in ${end}ms`);
}

async function main() {
  console.log("--- REDIS SCAN VS KEYS BENCHMARK ---");
  const pattern = "*";

  await benchKeys(pattern);
  await benchScan(pattern);

  console.log("--- BENCHMARK COMPLETE ---");
}

main().finally(() => process.exit(0));
