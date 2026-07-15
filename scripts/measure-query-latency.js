const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  log: ['query'],
});

async function measure() {
  console.log("--- Starting Latency Measurement (JS) ---");

  // Warm up
  try {
    await prisma.eventtype.findMany({ take: 1 });
  } catch (e) {
    console.error("Warmup failed:", e.message);
  }

  const start = Date.now();

  console.log("\n[Test 1] Fetching EventTypes...");
  const t1 = Date.now();
  await prisma.eventtype.findMany();
  console.log(`EventTypes took: ${Date.now() - t1}ms`);

  console.log("\n[Test 2] Fetching Categories...");
  const t2 = Date.now();
  await prisma.category.findMany();
  console.log(`Categories took: ${Date.now() - t2}ms`);

  const total = Date.now() - start;
  console.log(`\nTotal time for sequence: ${total}ms`);

  await prisma.$disconnect();
}

measure().catch(console.error);
