import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";
import { OperationsService } from "@/services/server/operations.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { body: content, isInternal } = body;

    const message = await OperationsService.addTicketMessage(id, admin.userId, content, isInternal);

    return NextResponse.json(message);
  }, req);
}
