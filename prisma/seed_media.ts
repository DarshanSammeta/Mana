import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const MEDIA_CATALOG = {
  eventTypes: {
    "Wedding": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200",
    "Engagement": "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1200",
    "Corporate Annual Meeting": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200",
    "Birthday (Kids)": "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=1200",
    "default": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200"
  },
  categories: {
    "Catering": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800",
    "Photography": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&q=80&w=800",
    "Decoration": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800",
    "Venue": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800",
    "Entertainment": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    "default": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800"
  },
  icons: {
    "Wedding": "https://cdn-icons-png.flaticon.com/512/3656/3656844.png",
    "Catering": "https://cdn-icons-png.flaticon.com/512/2704/2704332.png",
    "Photography": "https://cdn-icons-png.flaticon.com/512/3249/3249935.png",
    "Decoration": "https://cdn-icons-png.flaticon.com/512/1157/1157949.png",
    "default": "https://cdn-icons-png.flaticon.com/512/1043/1043444.png"
  },
  vendors: {
    logos: [
      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200",
      "https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&q=80&w=200"
    ],
    covers: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  packages: {
    "Catering": [
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800"
    ],
    "Photography": [
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1520853502310-59f03044955a?auto=format&fit=crop&q=80&w=800"
    ],
    "default": [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800"
    ]
  }
};

async function main() {
  console.log("🚀 Starting Optimized Media Assets Update...");

  // 1. Update Event Types
  console.log("🎭 Updating Event Types...");
  const eventTypes = await prisma.eventtype.findMany();
  for (const et of eventTypes) {
    const img = (MEDIA_CATALOG.eventTypes as any)[et.name] || MEDIA_CATALOG.eventTypes.default;
    const icon = (MEDIA_CATALOG.icons as any)[et.name] || MEDIA_CATALOG.icons.default;
    await prisma.eventtype.update({
      where: { id: et.id },
      data: { image: img, icon: icon }
    });
  }

  // 2. Update Categories
  console.log("📁 Updating Categories...");
  const categoryNames = Object.keys(MEDIA_CATALOG.categories).filter(k => k !== 'default');
  for (const name of categoryNames) {
    const img = (MEDIA_CATALOG.categories as any)[name];
    const icon = (MEDIA_CATALOG.icons as any)[name] || MEDIA_CATALOG.icons.default;
    await prisma.category.updateMany({
      where: { name: name },
      data: { image: img, icon: icon }
    });
  }
  // Default for others
  await prisma.category.updateMany({
    where: { name: { notIn: categoryNames } },
    data: { image: MEDIA_CATALOG.categories.default, icon: MEDIA_CATALOG.icons.default }
  });

  // 3. Update Vendors
  console.log("🏪 Updating Vendors...");
  await prisma.vendorprofile.updateMany({
    data: {
      logo: MEDIA_CATALOG.vendors.logos[0],
      coverImage: MEDIA_CATALOG.vendors.covers[0]
    }
  });

  // 4. Update Packages (Grouped by Category for updateMany)
  console.log("📦 Updating Packages...");
  const sts = await prisma.servicetype.findMany({
    include: { subcategory: { include: { category: true } } }
  });

  // Group serviceTypeIds by Category Name
  const catToStIds = new Map<string, string[]>();
  for (const st of sts) {
    const catName = st.subcategory.category.name;
    if (!catToStIds.has(catName)) catToStIds.set(catName, []);
    catToStIds.get(catName)!.push(st.id);
  }

  for (const [catName, stIds] of catToStIds.entries()) {
    const images = (MEDIA_CATALOG.packages as any)[catName] || MEDIA_CATALOG.packages.default;
    await prisma.renamedpackage.updateMany({
      where: { service: { serviceTypeId: { in: stIds } } },
      data: { images: images }
    });
    console.log(`Updated packages for category: ${catName}`);
  }

  console.log("✅ Media Assets Update Completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
