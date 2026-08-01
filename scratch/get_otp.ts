import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findUnique({ where: { email: 'customer2@example.com' } });
  console.log('OTP:' + user?.otp);
  await prisma.$disconnect();
}

run();
