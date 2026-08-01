const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userId = '1e716307-e4af-4cac-8bbb-5650b375e2a4';

async function main() {
  const query = `
    EXPLAIN ANALYZE
    SELECT "public"."booking"."id", "public"."booking"."createdAt"
    FROM "public"."booking"
    LEFT JOIN "public"."customerprofile" AS "j1" ON ("j1"."id") = ("public"."booking"."customerProfileId")
    WHERE ("j1"."userId" = '${userId}' AND ("j1"."id" IS NOT NULL))
    ORDER BY "public"."booking"."createdAt" DESC
    LIMIT 10;
  `;
  const result = await prisma.$queryRawUnsafe(query);
  console.log(result);
}

main().finally(() => prisma.$disconnect());
