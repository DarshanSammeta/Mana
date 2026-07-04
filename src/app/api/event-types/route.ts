import { NextResponse } from "next/server";
import { getEventTypes } from "@/lib/marketplace";

export async function GET() {
  try {
    const eventTypes = await getEventTypes();
    return NextResponse.json(eventTypes);
  } catch (error: any) {
    console.error("GET /api/event-types failed", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
