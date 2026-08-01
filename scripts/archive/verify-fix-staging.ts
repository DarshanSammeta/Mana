import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { performance } from "perf_hooks";

async function runTest(label: string, url: string) {
  console.log(`\n--- Testing: ${label} ---`);

  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ],
  });

  const queries: string[] = [];
  prisma.$on('query', (e) => {
    queries.push(e.query);
    if (e.query.includes("BEGIN") || e.query.includes("COMMIT") || e.query.includes("DEALLOCATE") || e.query.includes("SELECT")) {
        console.log(`  [QUERY] ${e.query.substring(0, 100)}...`);
    }
  });

  try {
    // Warm up
    await prisma.$queryRaw`SELECT 1`;

    const start = performance.now();
    // Simulate the notifications read - do it multiple times concurrently
    const CONCURRENCY = 10;
    const promises = Array.from({ length: CONCURRENCY }).map(() =>
        prisma.notification_preference.findMany({ take: 5 })
    );
    const results = await Promise.all(promises);
    const end = performance.now();

    const duration = end - start;
    const hasTransaction = queries.some(q => q.includes("BEGIN") || q.includes("COMMIT"));
    const hasDeallocate = queries.some(q => q.includes("DEALLOCATE"));

    console.log(`Result: ${results.length} concurrent requests completed`);
    console.log(`Latency: ${duration.toFixed(2)}ms`);
    console.log(`Transaction Wrapping (BEGIN/COMMIT): ${hasTransaction ? "YES ❌" : "NO ✅"}`);
    console.log(`Prepared Statement Management (DEALLOCATE): ${hasDeallocate ? "YES ❌" : "NO ✅"}`);

    if (duration > 5000) {
        console.log(`Timeout Risk (5s): HIGH ❌`);
    } else {
        console.log(`Timeout Risk (5s): LOW ✅`);
    }

  } catch (e: any) {
    console.error("Test failed:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  dotenv.config();
  const baseDbUrl = process.env.DATABASE_URL?.split('?')[0];

  if (!baseDbUrl) {
    console.error("DATABASE_URL not found in .env");
    process.exit(1);
  }

  // 1. Current "Bad" Production State (Simulated)
  const badUrl = `${baseDbUrl}?pgbouncer=true&connection_limit=1&pool_timeout=30`;
  await runTest("REGRESSED STATE (connection_limit=1, no cache fix)", badUrl);

  // 2. Proposed "Fixed" State
  const fixedUrl = `${baseDbUrl}?pgbouncer=true&connection_limit=10&pool_timeout=30&statement_cache_size=0`;
  await runTest("FIXED STATE (connection_limit=10, statement_cache_size=0)", fixedUrl);
}

main();
