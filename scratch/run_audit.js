const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const userId = '1e716307-e4af-4cac-8bbb-5650b375e2a4';
const role = 'CUSTOMER';
const secret = process.env.JWT_ACCESS_SECRET || 'mana-event-secret-key-1234567890';
const token = jwt.sign({ userId, role }, secret);

async function runAudit() {
  console.log('--- STARTING PARALLEL AUDIT SIMULATION ---');
  const T0 = Date.now();
  const requestId = 'audit-parallel-' + Math.random().toString(36).substring(7);

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

  const T4_parallel_start = Date.now();

  // Phase 1: Fetch base bookings
  console.log('[DIAGNOSTIC] Phase 1: Fetching Bookings...');
  const baseBookings = await prisma.booking.findMany({
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
      vendorId: true,
      city: true,
      state: true,
      eventTime: true
    }
  });

  if (baseBookings.length === 0) {
    console.log('No bookings found.');
  } else {
    const bookingIds = baseBookings.map(b => b.id);
    const vendorIds = [...new Set(baseBookings.map(b => b.vendorId).filter(Boolean))];

    // Phase 2: Parallel data fetching for relations
    console.log('[DIAGNOSTIC] Phase 2: Parallel Fetching Relations...');
    const [vendors, bookingItems, payments] = await Promise.all([
      prisma.vendorprofile.findMany({
        where: { id: { in: vendorIds } },
        select: {
          id: true,
          businessName: true,
          logo: true,
          city: true,
          state: true
        }
      }),
      prisma.bookingitem.findMany({
        where: { bookingId: { in: bookingIds } },
        select: {
          bookingId: true,
          price: true,
          quantity: true,
          service: { select: { title: true } },
          Renamedpackage: { select: { name: true } }
        }
      }),
      prisma.payment.findMany({
        where: { bookingId: { in: bookingIds } },
        select: {
          bookingId: true,
          status: true,
          amount: true,
          createdAt: true
        }
      })
    ]);

    // Phase 3: Assembly
    const vendorMap = new Map(vendors.map(v => [v.id, v]));
    const itemsMap = new Map();
    bookingItems.forEach(item => {
      const list = itemsMap.get(item.bookingId) || [];
      list.push(item);
      itemsMap.set(item.bookingId, list);
    });
    const paymentsMap = new Map();
    payments.forEach(p => {
      const list = paymentsMap.get(p.bookingId) || [];
      list.push(p);
      paymentsMap.set(p.bookingId, list);
    });

    const bookings = baseBookings.map(b => ({
      ...b,
      vendorprofile: b.vendorId ? vendorMap.get(b.vendorId) : null,
      bookingitem: itemsMap.get(b.id) || [],
      payment: paymentsMap.get(b.id) || []
    }));
    console.log(`Assembled ${bookings.length} bookings.`);
  }

  const T4_end = Date.now();
  console.log(`[DIAGNOSTIC] T4: Parallel Prisma Duration: ${T4_end - T4_parallel_start}ms`);

  const Tn_start = Date.now();
  const serialized = JSON.stringify(baseBookings); // just proxying for timing
  const Tn_end = Date.now();
  console.log(`[DIAGNOSTIC] Tn: Serialization: ${Tn_end - Tn_start}ms`);

  const Tend = Date.now();
  console.log(`[DIAGNOSTIC] Tend: Response Sent, Total: ${Tend - T0}ms`);
  console.log('--- PARALLEL AUDIT SIMULATION COMPLETE ---');
}

runAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
