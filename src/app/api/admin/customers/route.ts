import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { referralCode: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customerprofile.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          loyaltyPoints: true,
          referralCode: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              mobileNumber: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
      }),
      prisma.customerprofile.count({ where })
    ]);

    return NextResponse.json({
      rows: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  }, req);
}
