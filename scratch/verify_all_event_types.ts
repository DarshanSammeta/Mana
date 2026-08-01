import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  const eventTypes = ["Wedding", "Engagement", "Reception", "Birthday Party", "Corporate Event", "Baby Shower", "House Warming"];

  console.log("| Event Type | Total Results |");
  console.log("| :--- | :--- |");

  for (const et of eventTypes) {
    const where: any = {
      vendorprofile: {
        verificationStatus: 'APPROVED',
        isActive: true,
      },
      servicetype: {
        subcategory: {
          category: {
            eventtype: { name: { equals: et, mode: 'insensitive' } }
          }
        }
      }
    };

    try {
      const total = await prisma.service.count({ where });
      console.log(`| ${et} | ${total} |`);
    } catch (e) {
      console.log(`| ${et} | ERROR |`);
    }
  }
  await prisma.$disconnect();
}

test();
