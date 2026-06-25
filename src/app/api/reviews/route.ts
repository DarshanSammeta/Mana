import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { vendorId, serviceId, rating, comment, images } = await req.json();

    // Check if user has completed a booking with this vendor
    const booking = await prisma.booking.findFirst({
        where: {
            customerId: payload.userId,
            vendorId,
            status: "EVENT_COMPLETED"
        }
    });

    if (!booking) {
        return NextResponse.json({ message: "You can only review vendors after a completed booking" }, { status: 403 });
    }

    const review = await prisma.review.create({
      data: {
        id: crypto.randomUUID(),
        userId: payload.userId,
        vendorId,
        serviceId,
        rating,
        comment,
        images,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");
  const serviceId = searchParams.get("serviceId");
  const role = searchParams.get("role");

  try {
    let where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (serviceId) where.serviceId = serviceId;

    if (token) {
        const payload = verifyAccessToken(token);
        if (payload) {
            if (role === "CUSTOMER") {
                where.userId = payload.userId;
            } else if (role === "VENDOR") {
                const vendor = await prisma.vendorprofile.findUnique({
                    where: { userId: payload.userId }
                });
                if (vendor) {
                    where.vendorId = vendor.id;
                }
            }
        }
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: { fullName: true }
        },
        vendorprofile: {
            select: { businessName: true }
        },
        service: {
            select: { title: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
