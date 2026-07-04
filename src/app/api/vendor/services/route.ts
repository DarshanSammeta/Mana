import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { revalidateTag } from "next/cache";

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
                    eventtypes: {
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
  });
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
        serviceTypeId: body.serviceTypeId,
        title: body.title,
        description: body.description,
        basePrice: body.basePrice,
        pricingType: body.pricingType,
        updatedAt: new Date(),
        portfolio: {
          create: (body.images || []).map((url: string) => ({
            id: crypto.randomUUID(),
            vendorProfileId: vendorProfile.id,
            mediaUrl: url,
            mediaType: "IMAGE",
            title: body.title
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
  });
}
