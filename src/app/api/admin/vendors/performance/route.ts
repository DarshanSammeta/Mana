import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {

    console.log("========== PERFORMANCE API ==========");
    console.log("Authorization:", req.headers.get("authorization"));
    console.log("Cookie:", req.headers.get("cookie"));
    console.log("=====================================");

    const admin = await verifyAdminRequest(req);

    console.log("Admin:", admin);

    if (!admin) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const vendors = await prisma.vendorprofile.findMany({
      select: {
        id: true,
        businessName: true,
        verificationStatus: true,
        rating: true,
        totalBookings: true,
        reliabilityScore: true,
      },
    });

    const data = vendors.map((v) => ({
      id: v.id,
      business_name: v.businessName,
      status: v.verificationStatus,
      total_bookings: v.totalBookings ?? 0,
      completionRate: v.reliabilityScore ?? 0,
      cancellationRate: 0,
      rating: v.rating ?? 0,
      total_earnings: 0,
    }));

    return NextResponse.json(data);
  }, req);
}