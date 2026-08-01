import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function PUT(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, mobileNumber, language, timezone } = body;

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        fullName,
        mobileNumber,
        language,
        timezone,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        language: true,
        timezone: true,
      }
    });

    logger.info("Vendor account admin details updated", { userId: payload.userId });

    return NextResponse.json(updatedUser);
  }, req);
}
