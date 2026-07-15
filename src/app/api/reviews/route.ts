import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { z } from "zod";
import { ReviewService } from "@/services/server/review.service";

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(5),
  media: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "CUSTOMER") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const validated = reviewSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: validated.bookingId }
    });

    if (!booking || booking.customerId !== payload.userId) {
      return NextResponse.json({ message: "Invalid booking" }, { status: 400 });
    }

    if (booking.status !== "EVENT_COMPLETED" && booking.status !== "PAYMENT_RELEASED") {
      return NextResponse.json({ message: "Can only review completed bookings" }, { status: 400 });
    }

    // Check for spam
    const isSpam = await ReviewService.detectSpam(validated.comment);

    const review = await prisma.review.create({
      data: {
        bookingId: validated.bookingId,
        userId: payload.userId,
        vendorId: booking.vendorId!,
        rating: validated.rating,
        comment: validated.comment,
        isVerified: true,
        moderationStatus: isSpam ? "FLAGGED" : "PENDING",
        images: validated.media ? { urls: validated.media } : {},
      }
    });

    if (!isSpam) {
      await ReviewService.updateVendorRating(booking.vendorId!);
    }

    return NextResponse.json(review, { status: 201 });
  });
}
