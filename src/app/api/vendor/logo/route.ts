import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { url } = await req.json();

    if (!url) return NextResponse.json({ message: "Logo URL is required" }, { status: 400 });

    const profile = await prisma.vendorprofile.update({
      where: { userId: payload.userId },
      data: { logo: url },
      select: { id: true, logo: true }
    });

    logger.info("Vendor logo updated", { userId: payload.userId, vendorId: profile.id });

    return NextResponse.json(profile);
  }, req);
}

export async function DELETE(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const profile = await prisma.vendorprofile.update({
      where: { userId: payload.userId },
      data: { logo: null },
      select: { id: true, logo: true }
    });

    logger.info("Vendor logo deleted", { userId: payload.userId, vendorId: profile.id });

    return NextResponse.json(profile);
  }, req);
}
