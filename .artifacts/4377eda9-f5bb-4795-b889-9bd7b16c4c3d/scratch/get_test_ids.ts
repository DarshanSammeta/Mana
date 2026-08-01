import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const vendor = await prisma.vendorprofile.findFirst({
    include: { service: { include: { Renamedpackage: true } } }
  });
  const customer = await prisma.customerprofile.findFirst({
    include: { user: true }
  });

  console.log(JSON.stringify({
    vendorId: vendor?.id,
    serviceId: vendor?.service[0]?.id,
    packageId: vendor?.service[0]?.Renamedpackage[0]?.id,
    packagePrice: vendor?.service[0]?.Renamedpackage[0]?.price,
    customerId: customer?.id,
    userId: customer?.userId,
    customerEmail: customer?.user.email
  }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
