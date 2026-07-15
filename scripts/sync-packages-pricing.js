const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const PACKAGE_TEMPLATES = [
  {
    name: "Basic Package",
    description: "Essential services for small gatherings.",
    priceMultiplier: 1.0,
    guestRules: [
      { min: 0, max: 50, guestMultiplier: 0, flatFee: 0 },
      { min: 51, max: 100, guestMultiplier: 1.2, flatFee: 500 }
    ]
  },
  {
    name: "Standard Package",
    description: "Most popular choice for medium-sized events.",
    priceMultiplier: 1.8,
    guestRules: [
      { min: 0, max: 100, guestMultiplier: 0, flatFee: 0 },
      { min: 101, max: 250, guestMultiplier: 1.5, flatFee: 1000 },
      { min: 251, max: 500, guestMultiplier: 2.0, flatFee: 2000 }
    ]
  },
  {
    name: "Premium Package",
    description: "Luxury experience with full service and premium inclusions.",
    priceMultiplier: 3.2,
    guestRules: [
      { min: 0, max: 250, guestMultiplier: 0, flatFee: 0 },
      { min: 251, max: 500, guestMultiplier: 2.5, flatFee: 5000 },
      { min: 501, max: 1000, guestMultiplier: 3.5, flatFee: 10000 },
      { min: 1001, max: 5000, guestMultiplier: 5.0, flatFee: 25000 }
    ]
  }
];

async function main() {
  console.log('--- STARTING LEVEL 4 & 5 HIERARCHY SYNC (PACKAGES & PRICING) ---');

  const services = await prisma.service.findMany({
    include: { Renamedpackage: true }
  });

  console.log(`Found ${services.length} services to process.`);

  for (const service of services) {
    console.log(`Processing service: ${service.title}`);

    for (const template of PACKAGE_TEMPLATES) {
      const existingPkg = service.Renamedpackage.find(p => p.name === template.name);

      const packagePrice = Number(service.basePrice) * template.priceMultiplier;

      let pkg;
      if (!existingPkg) {
        pkg = await prisma.renamedpackage.create({
          data: {
            id: crypto.randomUUID(),
            serviceId: service.id,
            name: template.name,
            description: template.description,
            price: packagePrice,
            inclusions: JSON.stringify(["Standard Equipment", "Dedicated Staff", "Setup & Cleanup"]),
          }
        });
        console.log(`  + Created Package: ${template.name}`);
      } else {
        pkg = existingPkg;
        console.log(`  ~ Package exists: ${template.name}`);
      }

      // Sync Pricing Rules (Level 5)
      for (const rule of template.guestRules) {
        const existingRule = await prisma.pricingrule.findFirst({
          where: {
            packageId: pkg.id,
            minGuests: rule.min,
            maxGuests: rule.max
          }
        });

        const guestPrice = (packagePrice / 100) * rule.guestMultiplier; // Example scaling logic

        if (!existingRule) {
          await prisma.pricingrule.create({
            data: {
              id: crypto.randomUUID(),
              packageId: pkg.id,
              minGuests: rule.min,
              maxGuests: rule.max,
              pricePerGuest: guestPrice,
              flatFee: rule.flatFee
            }
          });
          console.log(`    + Created Pricing Rule: ${rule.min}-${rule.max} guests`);
        }
      }
    }
  }

  console.log('--- SYNC COMPLETE ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
