import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('--- Step 2: Querying Categories named "Photography" ---');
  // Note: category.eventtypes is a many-to-many relation, so we need to include them to see the links
  const categories = await prisma.category.findMany({
    where: { name: 'Photography' },
    include: { eventtype: true }
  });

  console.log(JSON.stringify(categories, null, 2));

  if (categories.length > 0) {
    const photographyId = categories[0].id; // Assuming there is at least one
    console.log(`\n--- Step 3: Querying Subcategories for categoryId: ${photographyId} ---`);
    const subcategories = await prisma.subcategory.findMany({
      where: { categoryId: photographyId }
    });
    console.log(JSON.stringify(subcategories, null, 2));

    console.log('\n--- Step 4: Analysis ---');
    console.log(`Number of "Photography" categories: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`Category ID: ${cat.id}, Name: ${cat.name}, Linked Event Type: ${(cat as any).eventtype?.name}`);
    });
  } else {
    console.log('No "Photography" category found.');
  }
}

verify()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
