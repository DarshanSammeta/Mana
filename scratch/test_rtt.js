const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    console.log(`Ping ${i}: ${Date.now() - start}ms`);
  }
}
run().finally(() => prisma.$disconnect());
