import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const addons = await prisma.package_addon.findMany({
      where: {
          packageId: id,
          isActive: true
      },
      orderBy: { price: 'asc' }
    });

    return NextResponse.json(addons);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
