import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ status: 403 });

  try {
    const { reason, description, evidence } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    const dispute = await prisma.dispute.create({
      data: {
        id: crypto.randomUUID(),
        bookingId: resolvedParams.id,
        raisedBy: payload.role,
        reason,
        description,
        evidence,
        status: 'OPEN',
        updatedAt: new Date()
      }
    });

    // Log the action using helper
    await createAuditLog({
      userId: payload.userId,
      action: 'DISPUTE_RAISED',
      details: { bookingId: resolvedParams.id, disputeId: dispute.id }
    });

    return NextResponse.json(dispute);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ status: 403 });

  try {
    const dispute = await prisma.dispute.findUnique({
      where: { bookingId: resolvedParams.id }
    });

    return NextResponse.json(dispute);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
