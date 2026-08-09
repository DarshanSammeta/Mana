import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const rows = notifications.map(n => ({
        id: n.id,
        title: n.title,
        channel: "in_app",
        audience: "all",
        status: "sent",
        created_at: n.createdAt
    }));

    return NextResponse.json(rows);
  }, req);
}

export async function POST(req: Request) {
    return withErrorHandler(async () => {
      const admin = await verifyAdminRequest(req);
      if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      const body = await req.json();
      const { title, body: content, target, channel } = body;

      // In a real app, this would trigger background jobs for PUSH/SMS/EMAIL
      // For now, we mock success

      return NextResponse.json({ success: true, message: "Broadcast initiated" });
    }, req);
}
