import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // Mocked for now as schema is missing
    return NextResponse.json([
        { id: "1", question: "How to book?", answer: "Follow the wizard", is_active: true, sort_order: 1 },
        { id: "2", question: "Cancellation policy?", answer: "Read the terms", is_active: true, sort_order: 2 }
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
