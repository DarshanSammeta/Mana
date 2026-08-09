import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const subcategories = await prisma.subcategory.findMany({
      include: {
        category: { select: { name: true } },
        _count: {
          select: { servicetype: true }
        }
      },
      orderBy: { name: "asc" }
    });

    const rows = subcategories.map(s => ({
        id: s.id,
        name: s.name,
        category_id: s.categoryId,
        category_name: s.category.name,
        is_active: true,
        sort_order: 0,
        service_type_count: s._count.servicetype
    }));

    return NextResponse.json(rows);
  }, req);
}

export async function POST(req: Request) {
    return withErrorHandler(async () => {
      const admin = await verifyAdminRequest(req);
      if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      const body = await req.json();
      const { id, name, category_id } = body;

      if (id) {
          const updated = await prisma.subcategory.update({
              where: { id },
              data: { name, categoryId: category_id }
          });
          return NextResponse.json(updated);
      }

      const created = await prisma.subcategory.create({
          data: { name, categoryId: category_id }
      });

      return NextResponse.json(created);
    }, req);
}
