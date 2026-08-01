import { NextResponse } from "next/server";
import { getEventTypes } from "@/lib/marketplace";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") || undefined;
    const eventTypes = await getEventTypes(vendorId);
    return NextResponse.json(eventTypes);
  } catch (error: any) {
    console.error("GET /api/event-types failed", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
