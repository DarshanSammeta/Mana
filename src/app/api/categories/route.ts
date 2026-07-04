import { NextResponse } from "next/server";
import { getMarketplaceCategories } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { unstable_cache } from "next/cache";

const getVendorCategories = (vendorId: string, eventTypeId: string | null) =>
  unstable_cache(
    async () => {
      return prisma.category.findMany({
        where: {
          subcategory: {
            some: {
              servicetype: {
                some: {
                  service: {
                    some: {
                      vendorProfileId: vendorId
                    }
                  }
                }
              }
            }
          },
          ...(eventTypeId ? {
            eventtypes: {
              some: { id: eventTypeId }
            }
          } : {})
        },
        orderBy: { name: "asc" }
      });
    },
    [`vendor-categories-${vendorId}-${eventTypeId || 'all'}`],
    { revalidate: 3600, tags: ['categories', `vendor-${vendorId}`] }
  )();

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const eventTypeId = searchParams.get("eventTypeId");

    if (vendorId) {
      const categories = await getVendorCategories(vendorId, eventTypeId);
      return NextResponse.json(categories);
    }

    const categoriesWithVendorCount = await getMarketplaceCategories(eventTypeId || undefined);
    return NextResponse.json(categoriesWithVendorCount);
  });
}
