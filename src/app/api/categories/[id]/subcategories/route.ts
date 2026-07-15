import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedSubcategories = (categoryId: string, vendorId: string | null) =>
  unstable_cache(
    async () => {
      return prisma.subcategory.findMany({
        where: {
          categoryId: categoryId,
          ...(vendorId ? {
            servicetype: {
              some: {
                service: {
                  some: {
                    vendorProfileId: vendorId
                  }
                }
              }
            }
          } : {})
        },
        orderBy: { name: "asc" },
      });
    },
    [`subcategories-${categoryId}-${vendorId || 'all'}`],
    { revalidate: 3600, tags: ['categories'] }
  )();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    const subcategories = await getCachedSubcategories(categoryId, vendorId);
    return NextResponse.json(subcategories);
  } catch {
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}
