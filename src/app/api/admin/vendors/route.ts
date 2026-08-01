import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { AuditService } from "@/services/server/audit.service";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") as any;
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.verificationStatus = status;
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendorprofile.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          businessName: true,
          verificationStatus: true,
          city: true,
          state: true,
          rating: true,
          reviewCount: true,
          totalBookings: true,
          reliabilityScore: true,
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
          user: {
            createdAt: "desc"
          }
        },
      }),
      prisma.vendorprofile.count({ where })
    ]);

    return NextResponse.json({
      rows: vendors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  }, req);
}

export async function PATCH(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { id, ...data } = body;

    const updatedVendor = await prisma.vendorprofile.update({
      where: { id },
      data,
    });

    await AuditService.log({
      entityType: "VENDOR_PROFILE",
      entityId: id,
      module: "ADMIN",
      action: "VENDOR_PROFILE_UPDATED",
      performedByUserId: admin.userId,
      performedByRole: admin.role,
      metadata: { updates: data },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    logger.info("Vendor profile updated by admin", { adminId: admin.userId, vendorProfileId: id, updates: data });

    return NextResponse.json(updatedVendor);
  }, req);
}
