import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const timeline = await prisma.bookingstatuslog.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
    });

    // Also fetch audit logs for system-level events if admin
    let auditEvents: any[] = [];
    if (payload.role === "ADMIN") {
        auditEvents = await prisma.auditlog.findMany({
            where: { details: { path: ["bookingId"], equals: bookingId } as any },
            orderBy: { createdAt: "asc" }
        });
    }

    return NextResponse.json({
        statusTimeline: timeline,
        systemTimeline: auditEvents
    });
  });
}
