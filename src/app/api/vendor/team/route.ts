import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ status: 403 });

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    const team = await prisma.vendorteam.findMany({
      where: { vendorProfileId: vendorProfile.id },
      orderBy: { joinedAt: "desc" }
    });

    return NextResponse.json(team);
  }, req);
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ status: 403 });

    const { name, role, email, phone, status } = await req.json();

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    const member = await prisma.vendorteam.create({
      data: {
        vendorProfileId: vendorProfile.id,
        name,
        role,
        email,
        phone,
        status: status || "Active",
        avatar: name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
      }
    });

    logger.info("Team member added", { vendorId: vendorProfile.id, memberId: member.id });
    return NextResponse.json(member);
  }, req);
}

export async function PATCH(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const payload = verifyAccessToken(token || "");
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ status: 403 });

    const { id, ...data } = await req.json();

    const member = await prisma.vendorteam.update({
      where: { id },
      data
    });

    return NextResponse.json(member);
  }, req);
}

export async function DELETE(req: Request) {
    return withErrorHandler(async () => {
      const token = req.headers.get("authorization")?.split(" ")[1];
      const payload = verifyAccessToken(token || "");
      if (!payload || payload.role !== "VENDOR") return NextResponse.json({ status: 403 });

      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");

      if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

      await prisma.vendorteam.delete({
        where: { id }
      });

      return NextResponse.json({ message: "Member removed" });
    }, req);
  }
