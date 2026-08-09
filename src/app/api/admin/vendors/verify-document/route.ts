import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OperationsService } from "@/services/server/operations.service";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { id, verified, notes } = body;

    const status = verified ? "APPROVED" : "REJECTED";
    const doc = await OperationsService.updateDocumentStatus(id, status as any);

    return NextResponse.json({ success: true, doc });
  }, req);
}
