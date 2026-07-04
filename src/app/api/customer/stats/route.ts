import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth";
import { getCustomerStats } from "@/lib/customer";

export async function GET(req: Request) {
  const payload = await getAuthPayload(req);
  if (!payload || payload.role !== "CUSTOMER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getCustomerStats(payload.userId);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Customer Stats Route Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
