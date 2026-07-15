import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function getSimilarVendors(vendorId: string, limit: number = 4) {
  return unstable_cache(
    async () => {
      const vendor = await prisma.vendorprofile.findUnique({
        where: { id: vendorId },
        select: {
          city: true,
          service: {
            select: {
              servicetype: {
                select: {
                  subcategoryId: true
                }
              }
            }
          }
        }
      });

      if (!vendor) return [];

      const subcategoryIds = vendor.service.map(s => s.servicetype.subcategoryId);

      return prisma.vendorprofile.findMany({
        where: {
          id: { not: vendorId },
          verificationStatus: "APPROVED",
          OR: [
            { city: vendor.city },
            {
              service: {
                some: {
                  servicetype: {
                    subcategoryId: { in: subcategoryIds }
                  }
                }
              }
            }
          ]
        },
        take: limit,
        select: {
          id: true,
          businessName: true,
          coverImage: true,
          rating: true,
          reviewCount: true,
          city: true,
          service: {
            take: 1,
            select: {
              basePrice: true
            }
          }
        },
        orderBy: [
          { rating: 'desc' },
          { totalBookings: 'desc' }
        ]
      });
    },
    [`similar-vendors-${vendorId}`],
    { revalidate: 3600, tags: ['recommendations'] }
  )();
}

export async function getFrequentlyBookedTogether(serviceId: string, limit: number = 4) {
  // Logic: Find bookings that contain this serviceId, then find other services in those same bookings
  const bookingsWithService = await prisma.bookingitem.findMany({
    where: { serviceId },
    select: { bookingId: true },
    take: 100
  });

  const bookingIds = bookingsWithService.map(b => b.bookingId);

  const relatedItems = await prisma.bookingitem.findMany({
    where: {
      bookingId: { in: bookingIds },
      serviceId: { not: serviceId }
    },
    select: {
      service: {
        select: {
          id: true,
          title: true,
          basePrice: true,
          vendorprofile: {
            select: {
              id: true,
              businessName: true,
              coverImage: true
            }
          }
        }
      }
    },
    take: limit
  });

  return relatedItems.map(item => item.service);
}

export async function getPersonalizedRecommendations(userId: string, limit: number = 8) {
  // Logic: Based on user's past bookings or recently viewed
  const userBookings = await prisma.booking.findMany({
    where: { customerId: userId },
    select: {
      bookingitem: {
        select: {
          service: {
            select: {
              servicetype: {
                select: {
                  subcategory: {
                    select: {
                      category: {
                        select: {
                          id: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  if (userBookings.length === 0) {
    // Fallback to trending
    return prisma.vendorprofile.findMany({
      where: { verificationStatus: "APPROVED" },
      take: limit,
      orderBy: { searchScore: 'desc' }
    });
  }

  const categoryIds = new Set<string>();
  userBookings.forEach(b => {
    b.bookingitem.forEach(item => {
        const catId = item.service.servicetype.subcategory.category.id;
        if (catId) {
            categoryIds.add(catId);
        }
    });
  });

  return prisma.vendorprofile.findMany({
    where: {
      verificationStatus: "APPROVED",
      service: {
        some: {
          servicetype: {
            subcategory: {
              categoryId: { in: Array.from(categoryIds) }
            }
          }
        }
      }
    },
    take: limit,
    orderBy: { rating: 'desc' }
  });
}
