const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const DATA = [
  { subName: 'Stage Decoration', types: ['Flower Decoration', 'Mandap Decoration', 'Theme Decoration', 'Balloon Decoration', 'Lighting'] },
  { subName: 'Wedding Photography', types: ['Traditional', 'Candid', 'Drone', 'Pre Wedding', 'Cinematography', 'Album'] },
  { subName: 'Event Catering', types: ['Veg', 'Non Veg', 'South Indian', 'North Indian', 'Chinese', 'Buffet', 'Live Counter'] },
  { subName: 'Audio Services', types: ['Basic DJ', 'Premium DJ', 'Celebrity DJ', 'Live Band', 'Sound Setup'] },
  { subName: 'Bakery', types: ['1 Tier', '2 Tier', '3 Tier', 'Custom'] }
];

async function main() {
  for (const item of DATA) {
    const sub = await prisma.subcategory.findFirst({
      where: { name: item.subName }
    });

    if (!sub) {
      console.log('Subcategory not found:', item.subName);
      continue;
    }

    for (const tName of item.types) {
      const existing = await prisma.servicetype.findFirst({
        where: { name: tName, subcategoryId: sub.id }
      });

      if (!existing) {
        await prisma.servicetype.create({
          data: {
            id: crypto.randomUUID(),
            name: tName,
            subcategoryId: sub.id,
            description: `${tName} service`
          }
        });
        console.log(`Created ServiceType: ${tName} under ${item.subName}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
