import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.subscriptionplan.findMany({
    select: {
      id: true,
      name: true,
      features: true,
    },
  });
  console.log("ACTUAL_PROD_DATA_START");
  console.log(JSON.stringify(plans, null, 2));
  console.log("ACTUAL_PROD_DATA_END");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
