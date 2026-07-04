import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventTypeId } = await params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    const categories = await prisma.category.findMany({
      where: {
        eventtypes: {
          some: { id: eventTypeId }
        },
        ...(vendorId ? {
          subcategory: {
            some: {
              servicetype: {
                some: {
                  service: {
                    some: { vendorProfileId: vendorId }
                  }
                }
              }
            }
          }
        } : {})
      },
      include: {
        eventtypes: true
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET /api/event-types/[id]/categories failed", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
