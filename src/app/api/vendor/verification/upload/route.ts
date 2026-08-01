import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { vendorDocumentSchema } from "@/validations/vendor";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type, url } = vendorDocumentSchema.parse(body);

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true, businessName: true }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });

    const document = await prisma.vendordocument.create({
      data: {
        id: crypto.randomUUID(),
        vendorProfileId: vendorProfile.id,
        type,
        url,
        status: "PENDING"
      }
    });

    logger.info("Verification document uploaded", { userId: payload.userId, type });

    return NextResponse.json(document, { status: 201 });
  }, req);
}
