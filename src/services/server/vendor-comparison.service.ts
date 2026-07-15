import "server-only";
import { getPrisma } from "@/lib/prisma";
if (typeof window !== "undefined") { throw new Error("vendor-comparison.service can only be used on the server."); }

export class VendorComparisonService {
  static async compareVendors(vendorIds: string[]) {
    const prisma = getPrisma();
    if (vendorIds.length > 4) {
      throw new Error("Can compare up to 4 vendors only");
    }

    const vendors = await prisma.vendorprofile.findMany({
      where: { id: { in: vendorIds } },
      include: {
        service: {
          include: {
            Renamedpackage: true,
          }
        },
        review: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return vendors.map(v => {
      const allPackages = v.service.flatMap(s => s.Renamedpackage);
      const minPrice = allPackages.length > 0 ? Math.min(...allPackages.map(p => Number(p.price))) : 0;

      return {
        id: v.id,
        businessName: v.businessName,
        logo: v.logo,
        rating: v.rating,
        reviewCount: v.reviewCount,
        experienceYears: v.experienceYears,
        totalBookings: v.totalBookings,
        responseTime: v.responseTime, // in minutes
        verificationStatus: v.verificationStatus,
        cancellationPolicy: v.cancellationPolicy,
        baseTravelCharge: Number(v.baseTravelCharge),
        minPackagePrice: minPrice,
        packagesCount: allPackages.length,
        // Portfolio summary (if needed)
        // Availability status (current)
      };
    });
  }
}
