const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'customerprofile';
  `);
  console.log(JSON.stringify(result, null, 2));
}

main().finally(() => prisma.$disconnect());
