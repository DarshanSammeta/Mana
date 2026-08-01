const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const userId = '1e716307-e4af-4cac-8bbb-5650b375e2a4';

async function sequentialFetch() {
  const start = Date.now();
  await prisma.booking.findMany({
    where: { customerprofile: { userId } },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      bookingNumber: true,
      vendorprofile: { select: { businessName: true } },
      bookingitem: { select: { price: true, service: { select: { title: true } } } },
      payment: { select: { status: true } }
    }
  });
  return Date.now() - start;
}

async function parallelFetch() {
  const start = Date.now();
  const baseBookings = await prisma.booking.findMany({
    where: { customerprofile: { userId } },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, vendorId: true }
  });

  const bookingIds = baseBookings.map(b => b.id);
  const vendorIds = [...new Set(baseBookings.map(b => b.vendorId).filter(Boolean))];

  await Promise.all([
    prisma.vendorprofile.findMany({ where: { id: { in: vendorIds } } }),
    prisma.bookingitem.findMany({ where: { bookingId: { in: bookingIds } } }),
    prisma.payment.findMany({ where: { bookingId: { in: bookingIds } } })
  ]);
  return Date.now() - start;
}

async function run() {
  console.log('Warming up...');
  await prisma.$queryRaw`SELECT 1`;

  console.log('--- ROUND 1 ---');
  console.log(`Seq: ${await sequentialFetch()}ms`);
  console.log(`Par: ${await parallelFetch()}ms`);

  console.log('--- ROUND 2 ---');
  console.log(`Seq: ${await sequentialFetch()}ms`);
  console.log(`Par: ${await parallelFetch()}ms`);
}

run().finally(() => prisma.$disconnect());
