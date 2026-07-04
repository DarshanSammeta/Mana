import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedServiceTypes = (subcategoryId: string, vendorId: string | null) =>
  unstable_cache(
    async () => {
      return prisma.servicetype.findMany({
        where: {
          subcategoryId,
          ...(vendorId ? {
            service: {
              some: {
                vendorProfileId: vendorId
              }
            }
          } : {})
        },
        orderBy: { name: "asc" },
      });
    },
    [`service-types-${subcategoryId}-${vendorId || 'all'}`],
    { revalidate: 3600, tags: ['service-types', `subcategory-${subcategoryId}`] }
  )();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    const serviceTypes = await getCachedServiceTypes(id, vendorId);
    return NextResponse.json(serviceTypes);
  } catch (error) {
    console.error("Failed to fetch service types:", error);
    return NextResponse.json({ error: "Failed to fetch service types" }, { status: 500 });
  }
}
