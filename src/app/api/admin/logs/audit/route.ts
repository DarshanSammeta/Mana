import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || searchParams.get("pageSize") || "50");
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { module: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.audit_log.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.audit_log.count({ where }),
    ]);

    const rows = logs.map(l => ({
        id: l.id,
        created_at: l.createdAt,
        actor_role: l.performedByRole,
        action: l.action,
        entity: l.entityType,
        entity_id: l.entityId,
        ip: l.ipAddress
    }));

    return NextResponse.json({ rows, total });
  }, req);
}
