import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { status, notes } = await req.json();

    const current = await prisma.event_incident_report.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const updated = await prisma.event_incident_report.update({
      where: { id },
      data: {
        status,
        description: notes ? `${current.description}\n\nAdmin Note: ${notes}` : current.description,
        resolvedAt: status === "RESOLVED" ? new Date() : undefined
      }
    });

    return NextResponse.json(updated);
  }, req);
}
