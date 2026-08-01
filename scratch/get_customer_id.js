const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
  if (user) {
    console.log(user.id);
  } else {
    console.log('No customer found');
  }
  await prisma.$disconnect();
}
run();
