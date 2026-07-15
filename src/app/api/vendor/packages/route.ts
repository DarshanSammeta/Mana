import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { z } from "zod";

const packageSchema = z.object({
  serviceId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  features: z.array(z.string()).optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  extraCharges: z.record(z.any()).optional(),
  discount: z.number().optional(),
  taxes: z.number().optional(),
  images: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  pricingRules: z.array(z.object({
    minGuests: z.number().int().min(0),
    maxGuests: z.number().int().min(0),
    pricePerGuest: z.number().positive(),
    flatFee: z.number().min(0).optional(),
  })).optional(),
});

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validatedData = packageSchema.parse(body);

    const service = await prisma.service.findFirst({
        where: {
            id: validatedData.serviceId,
            vendorprofile: { userId: payload.userId }
        }
    });

    if (!service) return NextResponse.json({ message: "Service not found or unauthorized" }, { status: 404 });

    const pkg = await prisma.renamedpackage.create({
      data: {
        id: crypto.randomUUID(),
        serviceId: validatedData.serviceId,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        inclusions: validatedData.inclusions,
        exclusions: validatedData.exclusions,
        images: validatedData.images,
        videos: validatedData.videos,
        pricingrule: validatedData.pricingRules ? {
          createMany: {
            data: validatedData.pricingRules.map(rule => ({
              id: crypto.randomUUID(),
              minGuests: rule.minGuests,
              maxGuests: rule.maxGuests,
              pricePerGuest: rule.pricePerGuest,
              flatFee: rule.flatFee || 0,
            }))
          }
        } : undefined
      },
      include: {
        pricingrule: true
      }
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Bad Request";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");

  if (!serviceId) return NextResponse.json({ message: "Service ID is required" }, { status: 400 });

  try {
    const packages = await prisma.renamedpackage.findMany({
      where: { serviceId },
    });

    return NextResponse.json(packages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
