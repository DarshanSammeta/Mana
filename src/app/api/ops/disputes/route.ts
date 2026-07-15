import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { OperationsService } from "@/services/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");

  const disputes = await prisma.dispute.findMany({
    where: {
      ...(bookingId && { bookingId }),
      ...(session.user.role !== "ADMIN" && { raisedBy: session.user.id }),
    },
    include: { booking: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(disputes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { bookingId, reason, description, evidence } = await req.json();
    const dispute = await OperationsService.raiseDispute(bookingId, session.user.id, {
      reason,
      description,
      evidence,
    });
    return NextResponse.json(dispute);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { disputeId, resolution, status } = await req.json();
    const dispute = await OperationsService.resolveDispute(disputeId, resolution, status);
    return NextResponse.json(dispute);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
