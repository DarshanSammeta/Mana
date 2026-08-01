import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database connection...');
  try {
    const count = await prisma.user.count();
    console.log(`Database reachable. User count: ${count}`);

    const cartItem = await prisma.cartitem.findFirst();
    console.log('CartItem sample:', cartItem);
  } catch (e) {
    console.error('Database check failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
