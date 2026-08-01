import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ status: 403 });

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    const teams = await prisma.vendor_team.findMany({
      where: { vendorProfileId: vendorProfile.id },
      include: {
          members: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(teams);
  }, req);
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ status: 403 });

    const { name, description } = await req.json();

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    const team = await prisma.vendor_team.create({
      data: {
        vendorProfileId: vendorProfile.id,
        name,
        description,
        isActive: true
      }
    });

    return NextResponse.json(team);
  }, req);
}
