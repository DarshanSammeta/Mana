import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const packages = await prisma.renamedpackage.findMany({
      include: {
          service: {
              include: { vendorprofile: { select: { businessName: true } } }
          }
      },
      take: 100
    });

    const rows = packages.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        vendor: p.service.vendorprofile.businessName,
        service: p.service.title,
        price: Number(p.price),
        duration_minutes: 60, // Mocked
        inclusions: p.inclusions,
        is_active: true
    }));

    return NextResponse.json(rows);
  }, req);
}

export async function POST(req: Request) {
    return withErrorHandler(async () => {
      const admin = await verifyAdminRequest(req);
      if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      const body = await req.json();
      const { id, name, description, price, serviceId, inclusions } = body;

      if (id) {
          const updated = await prisma.renamedpackage.update({
              where: { id },
              data: { name, description, price, inclusions }
          });
          return NextResponse.json(updated);
      }

      const created = await prisma.renamedpackage.create({
          data: { name, description, price, serviceId: serviceId || "", inclusions }
      });

      return NextResponse.json(created);
    }, req);
}
