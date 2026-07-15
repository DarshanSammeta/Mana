import { NextResponse } from "next/server";
import { VendorComparisonService } from "@/services/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids")?.split(",") || [];

  if (ids.length === 0) return NextResponse.json({ error: "No vendors selected" }, { status: 400 });

  try {
    const comparison = await VendorComparisonService.compareVendors(ids);
    return NextResponse.json(comparison);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
