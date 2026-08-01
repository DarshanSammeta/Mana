const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const logs = await prisma.audit_log.findMany({
    where: { action: 'PAYMENT_VERIFICATION_FAILED' },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  console.log(JSON.stringify(logs, null, 2));
  await prisma.$disconnect();
}
run();
