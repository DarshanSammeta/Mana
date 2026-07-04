import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

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

    const vendors = await prisma.vendorprofile.findMany({
      select: {
        id: true,
        businessName: true,
        verificationStatus: true,
        city: true,
        state: true,
        rating: true,
        reviewCount: true,
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
    });
    return NextResponse.json(vendors);
  });
}

export async function PATCH(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { id, ...data } = body;

    const updatedVendor = await prisma.vendorprofile.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: admin.userId,
      action: "VENDOR_PROFILE_UPDATED",
      details: { vendorProfileId: id, updates: data },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    logger.info("Vendor profile updated by admin", { adminId: admin.userId, vendorProfileId: id, updates: data });

    return NextResponse.json(updatedVendor);
  });
}
