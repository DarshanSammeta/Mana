import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth";
import { getVendorSubscription } from "@/lib/vendor";

export async function GET(req: Request) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await getVendorSubscription(payload.userId);
    if (!data) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Subscription GET error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
