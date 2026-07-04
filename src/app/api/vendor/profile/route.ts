import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { revalidateTag } from "next/cache";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const profile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: {
        id: true,
        businessName: true,
        description: true,
        logo: true,
        coverImage: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        serviceRadius: true,
        verificationStatus: true,
        rating: true,
        reviewCount: true,
        gstNumber: true,
        bankDetails: true,
        bufferTime: true,
        vacationMode: true,
        vacationStartDate: true,
        vacationEndDate: true,
        minBookingNotice: true,
        advanceBookingDays: true,
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            pricingType: true,
            basePrice: true,
            serviceTypeId: true,
            Renamedpackage: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                inclusions: true,
              },
            },
          },
        },
        portfolio: {
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            title: true,
          },
        },
        availability: {
          select: {
            id: true,
            date: true,
            isAvailable: true,
          },
          where: {
            date: { gte: new Date() },
          },
          take: 30,
        },
        vendordocument: {
          select: {
            id: true,
            type: true,
            url: true,
            status: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  });
}

export async function PATCH(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const profile = await prisma.vendorprofile.update({
      where: { userId: payload.userId },
      data: {
        bufferTime: body.bufferTime,
        vacationMode: body.vacationMode,
        vacationStartDate: body.vacationStartDate ? new Date(body.vacationStartDate) : null,
        vacationEndDate: body.vacationEndDate ? new Date(body.vacationEndDate) : null,
        minBookingNotice: body.minBookingNotice,
        advanceBookingDays: body.advanceBookingDays,
      },
    });

    revalidateTag('vendors');
    logger.info("Vendor settings updated", { userId: payload.userId });
    return NextResponse.json(profile);
  });
}

export async function PUT(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

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

    // Revalidate marketplace data
    revalidateTag('vendors');
    revalidateTag('marketplace');

    logger.info("Vendor profile updated", { userId: payload.userId, vendorId: result.id });
    return NextResponse.json(result);
  });
}
