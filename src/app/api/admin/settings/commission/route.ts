import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { createAuditLog } from "@/lib/audit";

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const setting = await prisma.globalsettings.findUnique({
      where: { key: "admin_commission_percentage" }
    });

    return NextResponse.json({
      commissionPercentage: setting ? parseFloat(setting.value) : 20
    });
  });
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { commissionPercentage } = await req.json();

    if (commissionPercentage === undefined || commissionPercentage < 0 || commissionPercentage > 100) {
      return NextResponse.json({ message: "Invalid commission percentage" }, { status: 400 });
    }

    await prisma.globalsettings.upsert({
      where: { key: "admin_commission_percentage" },
      update: { value: commissionPercentage.toString() },
      create: {
        id: crypto.randomUUID(),
        key: "admin_commission_percentage",
        value: commissionPercentage.toString(),
        description: "Percentage of total booking amount taken by the platform as commission."
      }
    });

    await createAuditLog({
      userId: admin.userId,
      action: "UPDATE_GLOBAL_SETTING",
      details: { key: "admin_commission_percentage", value: commissionPercentage },
      ipAddress: req.headers.get("x-forwarded-for") || undefined
    });

    logger.info("Admin updated global commission setting", {
      adminId: admin.userId,
      newPercentage: commissionPercentage
    });

    return NextResponse.json({ message: "Commission updated successfully" });
  });
}
