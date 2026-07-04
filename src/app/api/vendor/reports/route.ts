import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth";
import { getReportData, ReportType } from "@/lib/reports/reportGenerator";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as ReportType;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!type || !from || !to) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const vendor = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const startDate = new Date(from);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const { data } = await getReportData(vendor.id, type, startDate, endDate);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Report Generation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
