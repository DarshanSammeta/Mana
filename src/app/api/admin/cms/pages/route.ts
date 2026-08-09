import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // Mocked for now as schema is missing
    return NextResponse.json([
        { id: "1", title: "Terms of Service", slug: "terms", is_published: true, created_at: new Date() },
        { id: "2", title: "Privacy Policy", slug: "privacy", is_published: true, created_at: new Date() }
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
