import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { OperationsService } from "@/services/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = await prisma.support_ticket.findMany({
    where: session.user.role === "ADMIN" ? {} : { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { fullName: true, email: true } } }
  });

  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const ticket = await OperationsService.createTicket(session.user.id, body);
    return NextResponse.json(ticket);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
