import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result: any = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vendorprofile'
    `;
    console.log("Columns in vendorprofile table:");
    console.log(result.map((r: any) => r.column_name).join(", "));
  } catch (error) {
    console.error("Failed to query information_schema:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
