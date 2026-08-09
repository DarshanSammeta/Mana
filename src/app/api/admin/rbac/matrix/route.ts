import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // Mocked for now
    return NextResponse.json({
        roles: ["ADMIN", "SUPER_ADMIN", "SUPPORT_ADMIN"],
        modules: [
            { name: "DASHBOARD", roles: { "ADMIN": { view: true, edit: false } } },
            { name: "BOOKINGS", roles: { "ADMIN": { view: true, edit: true } } }
        ]
    });
  }, req);
}
