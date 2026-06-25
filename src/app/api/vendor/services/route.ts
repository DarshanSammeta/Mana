import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";

export async function GET(request: Request) {
  const payload = await getAuthPayload(request);
  if (!payload || payload.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });

    if (!vendorProfile) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

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
      }
    });
    return NextResponse.json(services);
  } catch (error) {
    console.error("GET Services Error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = await getAuthPayload(request);
  if (!payload || payload.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      include: {
        vendorsubscription: {
          include: { subscriptionplan: true }
        }
      }
    });

    if (!vendorProfile) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    // Check Listing Limit
    const currentServiceCount = await prisma.service.count({
      where: { vendorProfileId: vendorProfile.id }
    });

    const limit = vendorProfile.vendorsubscription?.subscriptionplan.listingLimit ?? 3;
    if (limit !== -1 && currentServiceCount >= limit) {
      return NextResponse.json({
        error: "Listing limit reached",
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
        updatedAt: new Date()
      }
    });
    return NextResponse.json(service);
  } catch (error) {
    console.error("POST Service Error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

