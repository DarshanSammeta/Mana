import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { ApiResponse } from "@/lib/api-response";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const userId = payload.userId;

    const reviews = await prisma.review.findMany({
      where: { customerprofile: { userId } },
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

    return ApiResponse.legacy(reviews);
  }, req);
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = await rateLimit(`review-create:${ip}`, { limit: 5, window: 3600 }); // 5 reviews per hour
    if (!rl.success) return rateLimitResponse(rl);

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "CUSTOMER") return NextResponse.json({ status: 403 });

    const { bookingId, vendorId, serviceId, rating, comment, images } = await req.json();
    const userId = payload.userId;

    // Resolve CustomerProfile
    const profile = await prisma.customerprofile.findUnique({
      where: { userId }
    });
    if (!profile) return NextResponse.json({ message: "Customer profile not found" }, { status: 404 });

    // IDOR Protection: Verify booking belongs to this customer
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { customerProfileId: true }
    });

    if (!booking || booking.customerProfileId !== profile.id) {
        return NextResponse.json({ message: "Unauthorized: You did not book this service" }, { status: 403 });
    }

    // Check if user has already reviewed this booking
    const existing = await prisma.review.findUnique({ where: { bookingId } });
    if (existing) return NextResponse.json({ message: "Booking already reviewed" }, { status: 400 });

    const review = await prisma.review.create({
      data: {
        id: crypto.randomUUID(),
        customerProfileId: profile.id,
        bookingId,
        vendorId,
        serviceId,
        rating,
        comment,
        images: images || [],
        updatedAt: new Date()
      }
    });

    return ApiResponse.success(review, { status: 201, message: "Review posted successfully" });
  }, req);
}
