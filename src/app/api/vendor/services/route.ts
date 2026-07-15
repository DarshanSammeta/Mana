import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const serviceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  basePrice: z.coerce.number().nonnegative("Price must be a non-negative number"),
  serviceTypeId: z.string().uuid("Invalid Service Type ID"),
  pricingType: z.enum(["PACKAGE", "HOURLY", "FIXED"]).default("PACKAGE"),
  inclusions: z.any().optional(),
  exclusions: z.any().optional(),
  faqs: z.any().optional(),
  terms: z.any().optional(),
  cancellationPolicy: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    const services = await prisma.service.findMany({
      where: { vendorProfileId: vendorProfile.id },
      select: {
        id: true,
        title: true,
        description: true,
        basePrice: true,
        pricingType: true,
        serviceTypeId: true,
        servicetype: {
          select: {
            id: true,
            name: true,
            subcategory: {
              select: {
                id: true,
                name: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    eventtype: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        Renamedpackage: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            inclusions: true
          }
        }
      }
    });
    return NextResponse.json(services);
  }, request);
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = serviceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const validated = result.data;

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

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    // Check Listing Limit
    const currentServiceCount = await prisma.service.count({
      where: { vendorProfileId: vendorProfile.id }
    });

    const limit = vendorProfile.vendorsubscription?.subscriptionplan.listingLimit ?? 3;
    if (limit !== -1 && currentServiceCount >= limit) {
      return NextResponse.json({
        message: `Your current plan allows only ${limit} listings. Please upgrade to add more.`
      }, { status: 403 });
    }

    const service = await prisma.service.create({
      data: {
        id: crypto.randomUUID(),
        vendorProfileId: vendorProfile.id,
        serviceTypeId: validated.serviceTypeId,
        title: validated.title,
        description: validated.description,
        basePrice: validated.basePrice,
        pricingType: validated.pricingType,
        // Note: inclusions, exclusions, etc. should be on the Renamedpackage model if using PACKAGE pricingType
        // based on the schema.
        updatedAt: new Date(),
        portfolio: {
          create: (validated.images || []).map((url: string) => ({
            id: crypto.randomUUID(),
            vendorProfileId: vendorProfile.id,
            mediaUrl: url,
            mediaType: "IMAGE",
            title: validated.title
          }))
        }
      },
      select: {
        id: true,
        vendorProfileId: true,
        serviceTypeId: true,
        title: true,
        description: true,
        basePrice: true,
        pricingType: true,
        // inclusions: true, - Removed as it's not in service model
        updatedAt: true,
        portfolio: {
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            title: true
          }
        }
      }
    });

    revalidateTag('vendors');
    revalidateTag('marketplace');

    logger.info("New service created by vendor", { vendorId: vendorProfile.id, serviceId: service.id });

    return NextResponse.json(service);
  }, request);
}
