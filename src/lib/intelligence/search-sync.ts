import { prisma } from "@/lib/prisma";
import { meiliClient, VENDORS_INDEX } from "@/lib/meilisearch";
import logger from "@/lib/logger";

export const syncVendorsToMeili = async () => {
  const vendors = await prisma.vendorprofile.findMany({
    where: {
      verificationStatus: "APPROVED",
    },
    include: {
      service: {
        include: {
          servicetype: {
            include: {
              subcategory: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const meiliData = vendors.map((v) => {
    const categories = new Set<string>();
    const serviceTypes = new Set<string>();

    v.service.forEach((s) => {
      serviceTypes.add(s.servicetype.name);
      if (s.servicetype.subcategory?.category?.name) {
        categories.add(s.servicetype.subcategory.category.name);
      }
    });

    return {
      id: v.id,
      businessName: v.businessName,
      description: v.description,
      city: v.city,
      state: v.state,
      rating: Number(v.rating),
      reviewCount: v.reviewCount,
      totalBookings: v.totalBookings,
      searchScore: v.searchScore,
      verificationStatus: v.verificationStatus,
      categories: Array.from(categories),
      serviceTypes: Array.from(serviceTypes),
      createdAt: v.createdAt.getTime(),
    };
  });

  const index = meiliClient.index(VENDORS_INDEX);
  await index.addDocuments(meiliData);
  logger.info(`Synced ${meiliData.length} vendors to Meilisearch`);
};
