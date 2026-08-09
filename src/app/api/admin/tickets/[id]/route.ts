import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const ticket = await prisma.support_ticket.findUnique({
      where: { id },
      include: {
          user: { select: { fullName: true, email: true, role: true } },
          messages: {
              orderBy: { createdAt: "asc" },
              include: { sender: { select: { fullName: true, role: true } } }
          }
      }
    });

    if (!ticket) return NextResponse.json({ message: "Ticket not found" }, { status: 404 });

    const data = {
        ...ticket,
        created_at: ticket.createdAt,
        opener: ticket.user?.fullName || "—",
        opener_email: ticket.user?.email || "—",
        opener_type: ticket.user?.role.toLowerCase() || "—",
        messages: (ticket as any).messages.map((m: any) => ({
            id: m.id,
            body: m.content,
            is_internal: m.isInternal,
            sender_name: m.sender?.fullName || "System",
            sender_role: m.sender?.role.toLowerCase() || "system",
            created_at: m.createdAt
        }))
    };

    return NextResponse.json(data);
  }, req);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return withErrorHandler(async () => {
      const { id } = await params;
      const admin = await verifyAdminRequest(req);
      if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      const body = await req.json();
      const { status, priority } = body;

      const updated = await prisma.support_ticket.update({
          where: { id },
          data: {
              status: status?.toUpperCase(),
              priority
          }
      });

      return NextResponse.json(updated);
    }, req);
}
