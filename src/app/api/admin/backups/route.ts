import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    return NextResponse.json([
        { id: "1", kind: "SCHEDULED", status: "SUCCESS", size_bytes: 1024 * 1024 * 50, location: "s3://backup/db_1.sql", createdAt: new Date() }
    ]);
  }, req);
}

export async function POST(req: Request) {
    return withErrorHandler(async () => {
      const admin = await verifyAdminRequest(req);
      if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      return NextResponse.json({ success: true });
    }, req);
}
