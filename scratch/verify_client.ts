import { PrismaClient } from '@prisma/client';

async function verify() {
  const prisma = new PrismaClient();
  try {
    console.log('Verifying Prisma Client and CartItem schema...');
    // This will fail if vendorId is missing in the client
    const item = await prisma.cartitem.findFirst({
        select: {
            vendorId: true,
            packagePrice: true,
            totalPrice: true
        }
    });
    console.log('Success! prisma.cartitem has the new fields.');
    console.log('Sample item:', item);
  } catch (error) {
    console.error('Prisma Client verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
