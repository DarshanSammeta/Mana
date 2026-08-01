const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const count = await prisma.booking.count({ where: { customerProfileId: 'ef105f3c-64d9-49ca-9217-68443e0350dc' } });
  console.log(count);
  await prisma.$disconnect();
}
run();
