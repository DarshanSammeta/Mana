import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const staff = await prisma.staff.findMany({
      where: { bookingId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(staff);
  } catch (error) {
    logger.error("Error fetching booking team", { error, bookingId: id });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { name, role, phone } = await req.json();

    if (!name || !role) {
      return NextResponse.json({ message: "Name and role are required" }, { status: 400 });
    }

    const staff = await prisma.staff.create({
      data: {
        id: crypto.randomUUID(),
        bookingId: id,
        name,
        role,
        phone,
        status: "ASSIGNED",
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    logger.error("Error adding team member", { error, bookingId: id });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staffId");

  if (!staffId) return NextResponse.json({ message: "Staff ID required" }, { status: 400 });

  try {
    await prisma.staff.delete({
      where: { id: staffId },
    });
    return NextResponse.json({ message: "Staff removed" });
  } catch (error) {
    logger.error("Error deleting team member", { error, bookingId: id, staffId });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
