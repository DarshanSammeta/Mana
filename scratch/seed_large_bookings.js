const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userId = '1e716307-e4af-4cac-8bbb-5650b375e2a4';

async function main() {
  const customer = await prisma.customerprofile.findUnique({
    where: { userId }
  });

  if (!customer) {
    console.error('Customer profile not found');
    return;
  }

  const vendor = await prisma.vendorprofile.findFirst();
  const service = await prisma.service.findFirst();
  const pkg = await prisma.Renamedpackage.findFirst();

  console.log(`Seeding 100 bookings for customer ${customer.id}...`);

  for (let i = 0; i < 100; i++) {
    await prisma.booking.create({
      data: {
        bookingNumber: `B-AUDIT-${i}-${Math.random().toString(36).substring(7)}`,
        customerProfileId: customer.id,
        vendorId: vendor.id,
        status: 'CONFIRMED',
        eventDate: new Date(),
        eventLocation: 'Test Location',
        guestCount: 50,
        totalAmount: 10000,
        bookingitem: {
          create: {
            serviceId: service.id,
            packageId: pkg.id,
            price: 10000,
            quantity: 1
          }
        },
        payment: {
          create: {
            amount: 10000,
            status: 'SUCCESS',
            updatedAt: new Date()
          }
        }
      }
    });
  }
  console.log('Done seeding.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
