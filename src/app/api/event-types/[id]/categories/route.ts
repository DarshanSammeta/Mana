import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { serializePrisma } from "@/lib/serialization";

const getCachedCategories = (eventTypeId: string, vendorId: string | null) =>
  unstable_cache(
    async () => {
      const result = await prisma.category.findMany({
        where: {
          eventTypeId: eventTypeId,
          ...(vendorId ? {
            subcategory: {
              some: {
                servicetype: {
                  some: {
                    service: {
                      some: {
                        vendorProfileId: vendorId,
                      }
                    }
                  }
                }
              }
            }
          } : {})
        },
        include: {
          eventtype: true
        },
        orderBy: { name: "asc" }
      });
      console.log(`[getCachedCategories] Found ${result.length} categories for eventType ${eventTypeId} and vendor ${vendorId}`);
      return serializePrisma(result);
    },
    [`event-type-categories-v4-${eventTypeId}-${vendorId || 'all'}`],
    { revalidate: 3600, tags: ['categories'] }
  )();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventTypeId } = await params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    console.log(`[GET /api/event-types/${eventTypeId}/categories] vendorId: ${vendorId}`);

    const categories = await getCachedCategories(eventTypeId, vendorId);

    console.log(`[GET /api/event-types/${eventTypeId}/categories] returning ${categories.length} categories`);

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET /api/event-types/[id]/categories failed", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
