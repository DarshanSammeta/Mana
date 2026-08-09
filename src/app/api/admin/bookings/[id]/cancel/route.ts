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
    const { reason } = body;

    if (!reason) {
        return NextResponse.json({ message: "Reason is required" }, { status: 400 });
    }

    const cancellation = await OperationsService.cancelBooking(id, admin.userId, reason);

    return NextResponse.json({
        success: true,
        message: "Booking cancelled by admin",
        data: cancellation
    });
  }, req);
}
