import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const eventType = await prisma.eventtype.findFirst({ select: { id: true, name: true } });
    const category = await prisma.category.findFirst({ select: { id: true, name: true, eventTypeId: true } });
    const subcategory = await prisma.subcategory.findFirst({ select: { id: true, name: true, categoryId: true } });
    const serviceType = await prisma.servicetype.findFirst({ select: { id: true, name: true, subcategoryId: true } });
    const pkg = await prisma.renamedpackage.findFirst({
      include: {
        service: {
          select: {
            vendorProfileId: true
          }
        }
      }
    });
    const user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' }, select: { email: true } });

    console.log(JSON.stringify({
      eventType,
      category,
      subcategory,
      serviceType,
      package: pkg,
      user
    }, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
