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

    const securityActions = [
        "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT",
        "PASSWORD_CHANGED", "PASSWORD_RESET_REQUESTED",
        "SESSION_REVOKED", "UNAUTHORIZED_ACCESS_ATTEMPT",
        "PAYMENT_VERIFICATION_FAILED"
    ];

    const where: any = {
        action: { in: securityActions }
    };

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { performedByName: { contains: search, mode: 'insensitive' } },
        { performedByUserId: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
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
        event_type: l.action,
        user_id: l.performedByUserId,
        ip: l.ipAddress,
        user_agent: l.metadata && typeof l.metadata === 'object' ? (l.metadata as any).userAgent : `${l.browser || ''} ${l.operatingSystem || ''}`.trim() || "—"
    }));

    return NextResponse.json({ rows, total });
  }, req);
}
