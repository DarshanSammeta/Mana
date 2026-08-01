import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { AuditService } from "@/services/server/audit.service";
import logger from "@/lib/logger";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "SUPPORT_ADMIN", "CONTENT_ADMIN"];

async function checkAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  const payload = await verifyAccessToken(token);

  if (!payload || !ADMIN_ROLES.includes(payload.role)) {
    return null;
  }

  return payload;
}

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const reported = searchParams.get("reported") === "true";
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== "all") where.moderationStatus = status;
    if (reported) where.reportCount = { gt: 0 };
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { customerprofile: { user: { fullName: { contains: search, mode: "insensitive" } } } },
        { vendorprofile: { businessName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          customerprofile: {
            include: { user: { select: { fullName: true, email: true } } }
          },
          vendorprofile: {
            select: { id: true, businessName: true }
          },
          booking: {
            select: { id: true, bookingNumber: true, eventDate: true }
          }
        },
        orderBy: reported ? { reportCount: "desc" } : { createdAt: "desc" },
      }),
      prisma.review.count({ where })
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  }, req);
}

export async function PATCH(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { moderationStatus: status },
    });

    await AuditService.log({
      entityType: "REVIEW",
      entityId: id,
      module: "ADMIN",
      action: "REVIEW_MODERATED",
      performedByUserId: admin.userId,
      performedByRole: admin.role,
      metadata: { status },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    logger.info("Review moderated by admin", { adminId: admin.userId, reviewId: id, status });

    return NextResponse.json(review);
  }, req);
}

export async function DELETE(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Missing review ID" }, { status: 400 });
    }

    await prisma.review.delete({
      where: { id },
    });

    await AuditService.log({
      entityType: "REVIEW",
      entityId: id,
      module: "ADMIN",
      action: "REVIEW_DELETED",
      performedByUserId: admin.userId,
      performedByRole: admin.role,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    return NextResponse.json({ success: true });
  }, req);
}
