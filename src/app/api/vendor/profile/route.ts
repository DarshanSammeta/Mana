import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const profile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      include: {
        service: {
          include: {
            Renamedpackage: true,
          },
        },
        portfolio: true,
        availability: true,
        vendordocument: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Perform update in a transaction if subcategoryIds are provided to create initial services
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.vendorprofile.update({
        where: { userId: payload.userId },
        data: {
          businessName: body.businessName,
          description: body.description,
          address: body.address,
          city: body.city,
          state: body.state,
          zipCode: body.zipCode,
          latitude: body.latitude,
          longitude: body.longitude,
          serviceRadius: body.serviceRadius,
          gstNumber: body.gstNumber,
          bankDetails: body.bankDetails,
        },
      });

      // If subcategoryIds are provided, create initial services for them if they don't exist
      if (body.subcategoryIds && Array.isArray(body.subcategoryIds)) {
        for (const subId of body.subcategoryIds) {
          // Find first service type for this subcategory as default
          const serviceType = await tx.servicetype.findFirst({
            where: { subcategoryId: subId }
          });

          if (serviceType) {
            // Check if service already exists for this vendor and service type
            const existing = await tx.service.findFirst({
              where: {
                vendorProfileId: profile.id,
                serviceTypeId: serviceType.id
              }
            });

            if (!existing) {
              await tx.service.create({
                data: {
                  id: crypto.randomUUID(),
                  vendorProfileId: profile.id,
                  serviceTypeId: serviceType.id,
                  title: `${serviceType.name} - ${profile.businessName}`,
                  description: `Quality ${serviceType.name} services by ${profile.businessName}`,
                  basePrice: 0,
                  pricingType: "PACKAGE",
                  updatedAt: new Date()
                }
              });
            }
          }
        }
      }

      return profile;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
