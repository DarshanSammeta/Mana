import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@manaevents.com' },
    include: { customerprofile: true }
  });
  console.log('HAS_PROFILE:' + !!user?.customerprofile);
  if (user && !user.customerprofile) {
    console.log('Creating profile for admin...');
    await prisma.customerprofile.create({
      data: {
        id: 'admin-profile-id',
        userId: user.id,
        referralCode: 'ADMIN-REF'
      }
    });
    console.log('Profile created.');
  }
  await prisma.$disconnect();
}

run();
