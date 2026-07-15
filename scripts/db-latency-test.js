const { PrismaClient } = require('@prisma/client');

async function testLatency() {
  const poolerClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  const directClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL
      }
    }
  });

  console.log('Testing Database Latency (CommonJS)...');

  try {
    // Warm up
    await poolerClient.$queryRaw`SELECT 1`;
    await directClient.$queryRaw`SELECT 1`;

    const poolerStarts = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await poolerClient.$queryRaw`SELECT 1`;
      poolerStarts.push(Date.now() - start);
    }

    const directStarts = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await directClient.$queryRaw`SELECT 1`;
      directStarts.push(Date.now() - start);
    }

    console.log('Pooler (6543) Latencies:', poolerStarts, 'ms');
    console.log('Pooler Average:', poolerStarts.reduce((a, b) => a + b, 0) / poolerStarts.length, 'ms');

    console.log('Direct (5432) Latencies:', directStarts, 'ms');
    console.log('Direct Average:', directStarts.reduce((a, b) => a + b, 0) / directStarts.length, 'ms');

  } catch (error) {
    console.error('Latency test failed:', error);
  } finally {
    await poolerClient.$disconnect();
    await directClient.$disconnect();
  }
}

testLatency();
