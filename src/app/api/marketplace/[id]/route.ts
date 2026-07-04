import { NextResponse } from "next/server";
import { getVendorById } from "@/lib/marketplace";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await getVendorById(id);

    if (!data) {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Vendor Profile API Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
