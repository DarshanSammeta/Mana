import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ status: 403 });

  try {
    const userId = payload.userId;

    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        vendorprofile: {
          select: { businessName: true, logo: true }
        },
        service: {
          select: { title: true }
        }
      }
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ status: 403 });

    try {
      const { bookingId, vendorId, serviceId, rating, comment, images } = await req.json();
      const userId = payload.userId;

      // Check if user has already reviewed this booking (if applicable) or vendor
      // For simplicity, we'll just create a new review record
      const review = await prisma.review.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          bookingId,
          vendorId,
          serviceId,
          rating,
          comment,
          images: images || [],
          updatedAt: new Date()
        }
      });

      // Update vendor rating (could be a separate background task or trigger)
      // For now, let's keep it simple

      return NextResponse.json(review);
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
