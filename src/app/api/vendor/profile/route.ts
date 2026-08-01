import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { revalidateTag } from "next/cache";
import { AuditService } from "@/services/server/audit.service";
import { vendorProfileSchema } from "@/validations/vendor";

export async function GET(req: Request) {
  const start = Date.now();
  const requestId = req.headers.get("x-request-id") || `prof_${Math.random().toString(36).substring(7)}`;

  return withErrorHandler(async () => {
    console.log(`[TRACE] [${requestId}] 1. Route Entry`);

    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    let finalUserId = userId;

    if (!finalUserId) {
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        const payload = await verifyAccessToken(token);
        if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        finalUserId = payload.userId;
    } else if (role !== "VENDOR") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    console.log(`[TRACE] [${requestId}] 3. Auth Success | User: ${finalUserId}`);

    // 2. Parallel Prisma Queries to reduce RTT overhead
    console.log(`[TRACE] [${requestId}] 4. Prisma Start (Parallel)`);
    try {
      const [profileData, services, portfolio, availability, documents] = await Promise.all([
        // Base Profile & User
        prisma.vendorprofile.findUnique({
          where: { userId: finalUserId },
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
            panNumber: true,
            aadhaarNumber: true,
            businessType: true,
            bankDetails: true,
            bufferTime: true,
            vacationMode: true,
            vacationStartDate: true,
            vacationEndDate: true,
            minBookingNotice: true,
            advanceBookingDays: true,
            website: true,
            socialLinks: true,
            workingHours: true,
            publicVisibility: true,
            user: {
              select: {
                fullName: true,
                email: true,
                mobileNumber: true,
                language: true,
                timezone: true,
                twoFactorEnabled: true,
              }
            }
          }
        }),
        // Services
        prisma.service.findMany({
          where: { vendorprofile: { userId: finalUserId } },
          select: {
            id: true,
            title: true,
            description: true,
            pricingType: true,
            basePrice: true,
            serviceTypeId: true,
            Renamedpackage: {
              select: { id: true, name: true, price: true },
              take: 5
            }
          },
          take: 10
        }),
        // Portfolio
        prisma.portfolio.findMany({
          where: { vendorprofile: { userId: finalUserId } },
          select: { id: true, mediaUrl: true, mediaType: true, title: true },
          take: 6
        }),
        // Availability
        prisma.availability.findMany({
          where: {
            vendorprofile: { userId: finalUserId },
            date: { gte: new Date() }
          },
          select: { id: true, date: true, isAvailable: true },
          take: 14
        }),
        // Documents
        prisma.vendordocument.findMany({
          where: { vendorprofile: { userId: finalUserId } },
          select: { id: true, type: true, url: true, status: true }
        })
      ]);

      console.log(`[TRACE] [${requestId}] 5. Prisma End`);

      if (!profileData) {
        return NextResponse.json({ message: "Profile not found" }, { status: 404 });
      }

      // Assemble full profile object
      const fullProfile = {
        ...profileData,
        service: services,
        portfolio: portfolio,
        availability: availability,
        vendordocument: documents
      };

      console.log(`[TRACE] [${requestId}] 6. Serialization Start`);
      const response = NextResponse.json(fullProfile);
      console.log(`[TRACE] [${requestId}] 7. Response Sent | Total: ${Date.now() - start}ms`);

      return response;
    } catch (err: any) {
      console.error(`[TRACE] [${requestId}] ERROR: ${err.message}`);
      throw err;
    }
  }, req);
}

export async function PATCH(req: Request) {
  return withErrorHandler(async () => {
    const userId = req.headers.get("x-user-id");
    let finalUserId = userId;

    if (!finalUserId) {
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        const payload = await verifyAccessToken(token);
        if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        finalUserId = payload.userId;
    }

    const body = await req.json();

    const profile = await prisma.vendorprofile.update({
      where: { userId: finalUserId },
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
    logger.info("Vendor settings updated", { userId: finalUserId });

    await AuditService.logVendorAction(
        profile.id,
        "VENDOR_SETTINGS_UPDATED",
        { id: finalUserId, name: profile.businessName, role: "VENDOR" },
        body
    );

    return NextResponse.json(profile);
  }, req);
}

export async function PUT(req: Request) {
  return withErrorHandler(async () => {
    const userId = req.headers.get("x-user-id");
    let finalUserId = userId;

    if (!finalUserId) {
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        const payload = await verifyAccessToken(token);
        if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        finalUserId = payload.userId;
    }

    const body = await req.json();
    const validatedData = vendorProfileSchema.parse(body);

    const oldProfile = await prisma.vendorprofile.findUnique({
        where: { userId: finalUserId },
        select: { bankDetails: true }
    });

    const result = await prisma.$transaction(async (tx) => {
    const profile = await tx.vendorprofile.update({
        where: { userId: finalUserId },
        data: {
          businessName: validatedData.businessName,
          businessType: validatedData.businessType,
          description: validatedData.description,
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          zipCode: validatedData.zipCode,
          serviceRadius: validatedData.serviceRadius,
          panNumber: validatedData.panNumber,
          aadhaarNumber: validatedData.aadhaarNumber,
          gstNumber: validatedData.gstNumber,
          bankDetails: validatedData.bankDetails as any,
          logo: validatedData.logo,
          coverImage: validatedData.coverImage,
          website: validatedData.website,
          socialLinks: validatedData.socialLinks as any,
          workingHours: validatedData.workingHours as any,
          publicVisibility: validatedData.publicVisibility,
          categoryId: validatedData.categoryId,
        },
      });

      if (validatedData.subcategoryIds && Array.isArray(validatedData.subcategoryIds)) {
        for (const subId of validatedData.subcategoryIds) {
          const serviceType = await tx.servicetype.findFirst({
            where: { subcategoryId: subId }
          });

          if (serviceType) {
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

    if (JSON.stringify(oldProfile?.bankDetails) !== JSON.stringify(body.bankDetails)) {
        await AuditService.logVendorAction(
            result.id,
            "VENDOR_BANK_DETAILS_UPDATED",
            { id: finalUserId, name: result.businessName, role: "VENDOR" },
            {
                old: { bankDetails: oldProfile?.bankDetails },
                new: { bankDetails: body.bankDetails }
            }
        );
    }

    await AuditService.logVendorAction(
        result.id,
        "VENDOR_PROFILE_UPDATED",
        { id: finalUserId, name: result.businessName, role: "VENDOR" },
        { fields: Object.keys(body) }
    );

    revalidateTag('vendors');
    revalidateTag('marketplace');

    logger.info("Vendor profile updated", { userId: finalUserId, vendorId: result.id });
    return NextResponse.json(result);
  }, req);
}
