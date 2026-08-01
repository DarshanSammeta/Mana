import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        customerprofile: {
          select: {
            id: true,
            loyaltyPoints: true,
            referralCode: true,
            profileImage: true,
          }
        },
        vendorprofile: {
          select: {
            id: true,
            businessName: true,
            verificationStatus: true,
            rating: true,
            category: {
              select: {
                name: true
              }
            },
            service: {
              select: {
                id: true,
                title: true
              },
              take: 5
            }
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Map response to match the requested contract while keeping compatibility
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        // Keep compatibility field
        verificationStatus: user.vendorprofile?.verificationStatus
      },
      customerProfile: user.customerprofile ? {
        id: user.customerprofile.id,
        loyaltyPoints: user.customerprofile.loyaltyPoints,
        referralCode: user.customerprofile.referralCode,
        profileImage: user.customerprofile.profileImage
      } : null,
      vendorProfile: user.vendorprofile ? {
        id: user.vendorprofile.id,
        businessName: user.vendorprofile.businessName,
        verificationStatus: user.vendorprofile.verificationStatus,
        category: user.vendorprofile.category?.name,
        services: user.vendorprofile.service
      } : null
    });
  }, req);
}
