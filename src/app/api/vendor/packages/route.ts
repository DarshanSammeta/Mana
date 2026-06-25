import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { serviceId, name, description, price, inclusions, exclusions, images } = body;

    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            vendorprofile: { userId: payload.userId }
        }
    });

    if (!service) return NextResponse.json({ message: "Service not found or unauthorized" }, { status: 404 });

    const pkg = await prisma.renamedpackage.create({
      data: {
        id: crypto.randomUUID(),
        serviceId,
        name,
        description,
        price,
        inclusions,
        exclusions,
        images,
      },
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");

  if (!serviceId) return NextResponse.json({ message: "Service ID is required" }, { status: 400 });

  try {
    const packages = await prisma.renamedpackage.findMany({
      where: { serviceId },
    });

    return NextResponse.json(packages);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
