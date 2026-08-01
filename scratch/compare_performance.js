const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

const userId = '1e716307-e4af-4cac-8bbb-5650b375e2a4';

async function sequentialFetch() {
  const start = Date.now();
  const bookings = await prisma.booking.findMany({
    where: { customerprofile: { userId } },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      bookingNumber: true,
      vendorprofile: { select: { businessName: true } },
      bookingitem: { select: { price: true, service: { select: { title: true } }, Renamedpackage: { select: { name: true } } } },
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
    select: { id: true, bookingNumber: true, vendorId: true }
  });

  const bookingIds = baseBookings.map(b => b.id);
  const vendorIds = [...new Set(baseBookings.map(b => b.vendorId).filter(Boolean))];

  const [vendors, items, payments] = await Promise.all([
    prisma.vendorprofile.findMany({ where: { id: { in: vendorIds } } }),
    prisma.bookingitem.findMany({ where: { bookingId: { in: bookingIds } }, include: { service: true, Renamedpackage: true } }),
    prisma.payment.findMany({ where: { bookingId: { in: bookingIds } } })
  ]);

  // Minimal assembly for timing
  const result = baseBookings.map(b => ({ ...b }));
  return Date.now() - start;
}

async function run() {
  console.log('Measuring RTT...');
  const pingStart = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  console.log(`Baseline Ping: ${Date.now() - pingStart}ms`);

  console.log('Running Sequential Fetch...');
  const seqTime = await sequentialFetch();
  console.log(`Sequential: ${seqTime}ms`);

  console.log('Running Parallel Fetch...');
  const parTime = await parallelFetch();
  console.log(`Parallel: ${parTime}ms`);

  console.log('--- RESULTS ---');
  console.log(`Improvement: ${seqTime - parTime}ms`);
}

run().finally(() => prisma.$disconnect());
