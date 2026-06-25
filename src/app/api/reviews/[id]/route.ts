import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { vendorResponse } = await req.json();
    const { id: reviewId } = await params;

    // Verify the review belongs to this vendor
    const vendor = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });

    if (!vendor) {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review || review.vendorId !== vendor.id) {
      return NextResponse.json({ message: "Review not found or unauthorized" }, { status: 404 });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        vendorResponse,
        responseAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedReview);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
