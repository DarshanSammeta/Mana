import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment_split.findMany({
        include: {
          payment: true,
          booking: {
            select: {
              bookingNumber: true,
              eventName: true
            }
          },
          vendor: {
            select: {
              businessName: true
            }
          },
          customer: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment_split.count(),
    ]);

    // Calculate overall stats
    const stats = await prisma.payment_split.aggregate({
      _sum: {
        totalAmount: true,
        adminShare: true,
        vendorShare: true,
      },
    });

    return NextResponse.json({
      payments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
      stats: {
        totalVolume: stats._sum.totalAmount || 0,
        totalCommission: stats._sum.adminShare || 0,
        totalVendorEarnings: stats._sum.vendorShare || 0,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
