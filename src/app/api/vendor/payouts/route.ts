import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { z } from "zod";

const bankDetailsSchema = z.object({
  bankName: z.string().min(2),
  accountNumber: z.string().min(9),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
  upiId: z.string().optional().or(z.literal("")),
});

export async function PUT(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = bankDetailsSchema.parse(body);

    const profile = await prisma.vendorprofile.update({
      where: { userId: payload.userId },
      data: { bankDetails: validatedData as any },
      select: { id: true, bankDetails: true }
    });

    logger.info("Vendor payout details updated", { userId: payload.userId, vendorId: profile.id });

    return NextResponse.json(profile);
  }, req);
}
