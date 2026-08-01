import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  const categories = ["Wedding", "Birthday Party", "Engagement", "Baby Shower", "Corporate Event"];

  for (const category of categories) {
    const start = Date.now();
    const where: any = {
        vendorprofile: {
          verificationStatus: 'APPROVED',
          isActive: true,
        },
        AND: [
            {
              OR: [
                {
                  servicetype: {
                    subcategory: {
                      category: {
                        name: { equals: category, mode: 'insensitive' }
                      }
                    }
                  }
                },
                {
                  servicetype: {
                    subcategory: {
                      name: { equals: category, mode: 'insensitive' }
                    }
                  }
                },
                {
                  servicetype: {
                    subcategory: {
                      category: {
                        eventtype: { name: { equals: category, mode: 'insensitive' } }
                      }
                    }
                  }
                }
              ]
            }
        ]
      };

    try {
        const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          take: 12,
          include: {
            vendorprofile: {
              select: { id: true, businessName: true }
            }
          }
        }),
        prisma.service.count({ where })
      ]);

      console.log(`[Category: ${category}] ${total} results in ${Date.now() - start}ms`);
    } catch (e) {
        console.error(`[Category: ${category}] Query failed:`, e);
    }
  }
  await prisma.$disconnect();
}

test();
