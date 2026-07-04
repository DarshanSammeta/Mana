import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedPackages = (serviceTypeId: string, vendorId: string | null) =>
  unstable_cache(
    async () => {
      return prisma.renamedpackage.findMany({
        where: {
          service: {
            serviceTypeId,
            ...(vendorId ? { vendorProfileId: vendorId } : {}),
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          inclusions: true,
          serviceId: true,
          pricingrule: {
            select: {
              id: true,
              minGuests: true,
              maxGuests: true,
              pricePerGuest: true,
              flatFee: true,
            }
          },
          service: {
            select: {
              id: true,
              title: true,
              vendorProfileId: true,
            }
          },
        },
      });
    },
    [`packages-${serviceTypeId}-${vendorId || 'all'}`],
    { revalidate: 3600, tags: ['packages', `service-type-${serviceTypeId}`] }
  )();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    const packages = await getCachedPackages(id, vendorId);
    return NextResponse.json(packages);
  } catch (error) {
    console.error("Failed to fetch packages:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}
