const { PrismaClient } = require('@prisma/client');

async function runTest() {
  const url = process.env.DATABASE_URL;
  console.log(`Running concurrency test against: ${url.split('@')[1]}`);

  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });

  const CONCURRENCY = 20;
  console.log(`Starting ${CONCURRENCY} concurrent requests...`);

  const start = Date.now();

  try {
    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENCY }).map(async (_, i) => {
        const reqStart = Date.now();
        await prisma.$queryRaw`SELECT 1 as result`;
        return Date.now() - reqStart;
      })
    );

    const totalTime = Date.now() - start;
    const latencies = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const errors = results.filter(r => r.status === 'rejected');

    console.log('\n--- RESULTS ---');
    console.log(`Successful: ${latencies.length}`);
    console.log(`Failed: ${errors.length}`);
    console.log(`Total Wall Time: ${totalTime}ms`);
    console.log(`Min Latency: ${Math.min(...latencies)}ms`);
    console.log(`Max Latency: ${Math.max(...latencies)}ms`);
    console.log(`Average Latency: ${(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)}ms`);

    if (errors.length > 0) {
      console.log('Sample Error:', errors[0].reason.message);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
