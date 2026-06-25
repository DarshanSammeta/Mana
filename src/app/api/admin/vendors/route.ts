import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const vendors = await prisma.vendorprofile.findMany({
      include: {
        user: {
          select: { fullName: true, email: true, mobileNumber: true }
        }
      },
      orderBy: {
        user: {
          createdAt: "desc"
        }
      },
    });
    return NextResponse.json(vendors);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    const updatedVendor = await prisma.vendorprofile.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: payload.userId,
      action: "VENDOR_PROFILE_UPDATED",
      details: { vendorProfileId: id, updates: data },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    return NextResponse.json(updatedVendor);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
