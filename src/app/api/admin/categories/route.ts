import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { subcategory: true, vendorprofile: true }
        }
      },
      orderBy: { name: "asc" }
    });

    const rows = categories.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        is_active: true, // Assuming default active
        vendor_count: c._count.vendorprofile,
        subcategory_count: c._count.subcategory
    }));

    return NextResponse.json(rows);
  }, req);
}

export async function POST(req: Request) {
    return withErrorHandler(async () => {
      const admin = await verifyAdminRequest(req);
      if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      const body = await req.json();
      const { name, description, icon, eventTypeId } = body;

      const category = await prisma.category.create({
          data: {
              name,
              description,
              icon,
              eventTypeId: eventTypeId || (await prisma.eventtype.findFirst())?.id || ""
          }
      });

      return NextResponse.json(category);
    }, req);
}
