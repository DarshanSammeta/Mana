import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { sendNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const { bookingId, rating, comment, images, videoUrl } = await req.json();

    if (!bookingId || !rating) {
      return NextResponse.json({ message: "Booking ID and Rating are required" }, { status: 400 });
    }

    // 1. Verify Booking Ownership and Status
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingNumber: true,
        eventName: true,
        customerId: true,
        vendorId: true,
        status: true,
        bookingitem: {
            select: { serviceId: true }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    if (booking.customerId !== payload.userId) {
      return NextResponse.json({ message: "You can only review your own bookings" }, { status: 403 });
    }

    if (booking.status !== "EVENT_COMPLETED") {
      return NextResponse.json({ message: "You can only review completed bookings" }, { status: 400 });
    }

    // 2. Check for existing review
    const existingReview = await prisma.review.findUnique({
      where: { bookingId }
    });

    if (existingReview) {
      return NextResponse.json({ message: "You have already reviewed this booking" }, { status: 400 });
    }

    // 3. Create Review
    const review = await prisma.review.create({
      data: {
        id: crypto.randomUUID(),
        userId: payload.userId,
        vendorId: booking.vendorId,
        bookingId: bookingId,
        serviceId: booking.bookingitem[0]?.serviceId, // Associate with primary service
        rating,
        comment,
        images,
        videoUrl,
        isVerified: true,
        moderationStatus: "APPROVED", // Auto-approve for now, can be changed to PENDING for strict moderation
      }
    });

    // 4. Update Vendor Rating (Async calculation)
    // In a real enterprise app, this might be handled by a background job or a trigger
    const stats = await prisma.review.aggregate({
        where: { vendorId: booking.vendorId, moderationStatus: "APPROVED" },
        _avg: { rating: true },
        _count: { id: true }
    });

    await prisma.vendorprofile.update({
        where: { id: booking.vendorId },
        data: {
            rating: stats._avg.rating || 0,
            reviewCount: stats._count.id
        }
    });

    // 5. Notify Vendor of New Review
    const vendor = await prisma.vendorprofile.findUnique({
        where: { id: booking.vendorId },
        select: { userId: true }
    });

    if (vendor) {
        await sendNotification({
            userId: vendor.userId,
            title: "New Review Received ⭐",
            message: `A customer has left a ${rating}-star review for "${booking.eventName}".`,
            category: "REVIEW",
            priority: "MEDIUM",
            link: `/vendor/reviews`,
            metadata: {
                reviewId: review.id,
                bookingNumber: booking.bookingNumber,
                rating,
            }
        });
    }

    logger.info("New verified review submitted", { reviewId: review.id, vendorId: booking.vendorId });

    return NextResponse.json(review, { status: 201 });
  });
}
