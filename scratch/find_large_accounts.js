const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const counts = await prisma.booking.groupBy({
    by: ['customerProfileId'],
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 5
  });

  for (const c of counts) {
     const profile = await prisma.customerprofile.findUnique({
       where: { id: c.customerProfileId },
       include: { user: true }
     });
     console.log(`Profile: ${c.customerProfileId}, User: ${profile.user.email}, Count: ${c._count.id}`);
  }
}

run().finally(() => prisma.$disconnect());
