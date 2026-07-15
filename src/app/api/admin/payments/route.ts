import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAccessToken } from "@/lib/auth";

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

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
  }, req);
}
