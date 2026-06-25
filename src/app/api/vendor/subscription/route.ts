import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      include: {
        vendorsubscription: {
          include: {
            subscriptionplan: true,
          },
        },
      },
    });

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    const [plans, serviceCount] = await Promise.all([
      prisma.subscriptionplan.findMany({
        orderBy: { rank: 'asc' }
      }),
      prisma.service.count({
        where: { vendorProfileId: vendorProfile.id }
      })
    ]);

    return NextResponse.json({
      currentSubscription: vendorProfile.vendorsubscription,
      plans,
      usage: {
        services: serviceCount,
        limit: vendorProfile.vendorsubscription?.subscriptionplan.listingLimit || 3
      }
    });
  } catch (error) {
    console.error("Subscription GET error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
