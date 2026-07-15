import { prisma } from "@/lib/prisma";
import { meiliClient, VENDORS_INDEX } from "@/lib/meilisearch";
import logger from "@/lib/logger";

export const syncVendorsToMeili = async () => {
  try {
    const BATCH_SIZE = 100;
    let skip = 0;
    let allMeiliData: any[] = [];

    while (true) {
      const vendors = await prisma.vendorprofile.findMany({
        where: {
          verificationStatus: "APPROVED",
        },
        take: BATCH_SIZE,
        skip: skip,
        select: {
          id: true,
          businessName: true,
          description: true,
          city: true,
          state: true,
          rating: true,
          reviewCount: true,
          totalBookings: true,
          searchScore: true,
          verificationStatus: true,
          experienceYears: true,
          createdAt: true,
          service: {
            select: {
              servicetype: {
                select: {
                  name: true,
                  subcategory: {
                    select: {
                      name: true,
                      category: {
                        select: {
                          name: true,
                          eventtype: {
                            select: {
                              name: true
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              Renamedpackage: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      if (vendors.length === 0) break;

      const batchMeiliData = vendors.map((v) => {
        const eventTypes = new Set<string>();
        const categories = new Set<string>();
        const subcategories = new Set<string>();
        const serviceTypes = new Set<string>();
        const packages = new Set<string>();

        v.service.forEach((s) => {
          serviceTypes.add(s.servicetype.name);

          const sub = s.servicetype.subcategory;
          if (sub) {
            subcategories.add(sub.name);
            const cat = sub.category;
            if (cat) {
              categories.add(cat.name);
              if (cat.eventtype) {
                eventTypes.add(cat.eventtype.name);
              }
            }
          }

          s.Renamedpackage.forEach(p => {
            packages.add(p.name);
          });
        });

        const allPrices = v.service.flatMap(s => s.Renamedpackage.map(p => Number(p.price)));
        const avgPrice = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0;

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
          experienceYears: v.experienceYears,
          avgPrice,
          eventTypes: Array.from(eventTypes),
          categories: Array.from(categories),
          subcategories: Array.from(subcategories),
          serviceTypes: Array.from(serviceTypes),
          packages: Array.from(packages),
          createdAt: v.createdAt.getTime(),
        };
      });

      allMeiliData = [...allMeiliData, ...batchMeiliData];
      skip += BATCH_SIZE;
    }

    const index = meiliClient.index(VENDORS_INDEX);
    await index.addDocuments(allMeiliData);

    // Set filterable and sortable attributes to ensure PricingInsightsService works
    await index.updateFilterableAttributes(['city', 'categories', 'serviceTypes', 'rating', 'avgPrice']);
    await index.updateSortableAttributes(['rating', 'avgPrice', 'totalBookings', 'reviewCount']);

    logger.info(`Synced ${allMeiliData.length} vendors to Meilisearch and updated settings`);
  } catch (error) {
    logger.error("Failed to sync vendors to Meilisearch", error);
    throw error;
  }
};
