import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const tickets = await prisma.support_ticket.findMany({
      include: {
          user: { select: { fullName: true, email: true, role: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    const rows = tickets.map(t => ({
        id: t.id,
        subject: t.subject,
        opener: t.user?.fullName || "—",
        opener_type: t.user?.role.toLowerCase() || "—",
        priority: t.priority || "MEDIUM",
        created_at: t.createdAt,
        status: t.status.toLowerCase()
    }));

    return NextResponse.json(rows);
  }, req);
}
