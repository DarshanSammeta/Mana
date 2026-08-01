const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Use DIRECT_URL to bypass the pooler for this test
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

const userId = '1e716307-e4af-4cac-8bbb-5650b375e2a4';
const role = 'CUSTOMER';
const secret = process.env.JWT_ACCESS_SECRET || 'mana-event-secret-key-1234567890';
const token = jwt.sign({ userId, role }, secret);

async function runAudit() {
  console.log('--- STARTING DIRECT AUDIT SIMULATION ---');
  const T0 = Date.now();
  const requestId = 'audit-direct-' + Math.random().toString(36).substring(7);

  const T1_start = Date.now();
  const payload = jwt.verify(token, secret);
  const T1_end = Date.now();
  console.log(`[DIAGNOSTIC] T1: Auth/Session Check: ${T1_end - T1_start}ms`);

  const T2_start = Date.now();
  const T2_end = Date.now();
  console.log(`[DIAGNOSTIC] T2: Params Parsing: ${T2_end - T2_start}ms`);

  const T3 = Date.now();
  console.log(`[DIAGNOSTIC] T3: Before Prisma Call: ${T3 - T0}ms from start`);

  const whereClause = { customerprofile: { userId: payload.userId } };

  const T4_pool_wait_start = Date.now();
  const bookings = await prisma.booking.findMany({
    where: whereClause,
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      bookingNumber: true,
      eventName: true,
      eventDate: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      vendorprofile: {
        select: {
          businessName: true,
          logo: true,
          city: true,
          state: true
        }
      },
      bookingitem: {
        select: {
          price: true,
          quantity: true,
          service: {
            select: { title: true }
          },
          Renamedpackage: {
            select: { name: true }
          }
        }
      },
      payment: {
        select: {
          status: true,
          amount: true,
          createdAt: true
        }
      }
    }
  });
  const T4_end = Date.now();
  console.log(`[DIAGNOSTIC] T4: Prisma Call Duration (DIRECT): ${T4_end - T4_pool_wait_start}ms`);

  const Tend = Date.now();
  console.log(`[DIAGNOSTIC] Tend: Response Sent, Total: ${Tend - T0}ms`);
  console.log('--- DIRECT AUDIT SIMULATION COMPLETE ---');
}

runAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
