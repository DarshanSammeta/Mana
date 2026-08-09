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
    const limit = parseInt(searchParams.get("limit") || searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { vendorprofile: { businessName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendorprofile: { select: { businessName: true } },
          servicetype: { include: { subcategory: { include: { category: true } } } }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.service.count({ where })
    ]);

    const rows = services.map(s => ({
        id: s.id,
        name: s.title,
        vendor: s.vendorprofile.businessName,
        category: s.servicetype?.subcategory?.category?.name || "—",
        subcategory: s.servicetype?.subcategory?.name || "—",
        base_price: Number(s.basePrice),
        duration_minutes: 0, // Mocked or check schema
        is_active: true,
        created_at: s.createdAt
    }));

    return NextResponse.json({ rows, total, page, limit });
  }, req);
}
