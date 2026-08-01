import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const serviceSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  basePrice: z.coerce.number().gt(0, "Price must be greater than 0"),
  discountPrice: z.coerce.number().optional(),
  serviceTypeId: z.string().min(1, "Service Type is required"),
  pricingType: z.enum(["PACKAGE", "HOURLY", "FIXED"]).default("PACKAGE"),
  duration: z.string().optional(),
  maxGuests: z.coerce.number().optional(),
  advancePercentage: z.coerce.number().optional(),
  cancellationPolicy: z.string().optional(),
  serviceRadius: z.coerce.number().optional(),
  citiesServed: z.array(z.string()).optional(),
  features: z.array(z.string()).min(1, "At least one highlight required").optional(),
  images: z.array(z.string().url()).min(3, "At least 3 portfolio images required").optional(),
  availableDays: z.array(z.number()).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isDraft: z.boolean().default(false),
});

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });

    const services = await prisma.service.findMany({
      where: { vendorProfileId: vendorProfile.id },
      include: {
        servicetype: {
          include: {
            subcategory: {
              include: {
                category: true
              }
            }
          }
        },
        Renamedpackage: true
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(services);
  }, request);
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const validated = validation.data;

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: {
        id: true,
        vendorsubscription: {
          select: {
            subscriptionplan: {
              select: {
                listingLimit: true
              }
            }
          }
        }
      }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });

    // 1. Duplicate Title Check
    const existing = await prisma.service.findFirst({
      where: {
        vendorProfileId: vendorProfile.id,
        title: { equals: validated.title, mode: 'insensitive' }
      }
    });

    if (existing) {
      return NextResponse.json({ message: "You already have a service listing with this title." }, { status: 400 });
    }

    // 2. Listing Limit Enforcement
    const currentServiceCount = await prisma.service.count({ where: { vendorProfileId: vendorProfile.id } });
    const limit = vendorProfile.vendorsubscription?.subscriptionplan.listingLimit ?? 3;
    if (limit !== -1 && currentServiceCount >= limit) {
      return NextResponse.json({ message: `Listing limit reached (${limit}). Please upgrade your plan.` }, { status: 403 });
    }

    // 3. Atomic Creation
    const service = await prisma.$transaction(async (tx) => {
      const newService = await tx.service.create({
        data: {
          id: crypto.randomUUID(),
          vendorProfileId: vendorProfile.id,
          serviceTypeId: validated.serviceTypeId,
          title: validated.title,
          description: validated.description,
          basePrice: validated.basePrice,
          pricingType: validated.pricingType,
          updatedAt: new Date(),
        }
      });

      if (validated.images && validated.images.length > 0) {
        await tx.portfolio.createMany({
          data: validated.images.map((url) => ({
            id: crypto.randomUUID(),
            vendorProfileId: vendorProfile.id,
            serviceId: newService.id,
            mediaUrl: url,
            mediaType: "IMAGE",
            title: validated.title
          }))
        });
      }

      // Metadata stored in default package
      await tx.renamedpackage.create({
        data: {
          id: crypto.randomUUID(),
          serviceId: newService.id,
          name: "Standard Package",
          price: validated.basePrice,
          description: `Default package for ${validated.title}`,
          inclusions: {
            features: validated.features,
            duration: validated.duration,
            maxGuests: validated.maxGuests,
            advancePercentage: validated.advancePercentage,
            cancellationPolicy: validated.cancellationPolicy,
            citiesServed: validated.citiesServed,
            operatingHours: { start: validated.startTime, end: validated.endTime, days: validated.availableDays }
          }
        }
      });

      if (validated.serviceRadius) {
        await tx.vendorprofile.update({
          where: { id: vendorProfile.id },
          data: { serviceRadius: validated.serviceRadius }
        });
      }

      return newService;
    });

    revalidateTag('vendors');
    revalidateTag('marketplace');
    logger.info("New service created", { vendorId: vendorProfile.id, serviceId: service.id });

    return NextResponse.json(service);
  }, request);
}
