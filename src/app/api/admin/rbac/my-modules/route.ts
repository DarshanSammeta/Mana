import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // Mocked module permissions
    return NextResponse.json([
        { module: "DASHBOARD", can_view: true, can_edit: true },
        { module: "CUSTOMERS", can_view: true, can_edit: true },
        { module: "VENDORS", can_view: true, can_edit: true },
        { module: "BOOKINGS", can_view: true, can_edit: true },
        { module: "FINANCE", can_view: true, can_edit: true },
        { module: "SAFETY", can_view: true, can_edit: true },
        { module: "CATALOG", can_view: true, can_edit: true },
        { module: "SUPPORT", can_view: true, can_edit: true },
        { module: "REPORTS", can_view: true, can_edit: true },
        { module: "CMS", can_view: true, can_edit: true },
        { module: "SETTINGS", can_view: true, can_edit: true },
        { module: "ADMINS", can_view: admin.role === 'SUPER_ADMIN', can_edit: admin.role === 'SUPER_ADMIN' }
    ]);
  }, req);
}
