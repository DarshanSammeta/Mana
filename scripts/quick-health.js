const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log("Checking DB connection...");
  try {
    await prisma.$connect();
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("DB OK:", res);
  } catch (e) {
    console.error("DB FAIL:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
