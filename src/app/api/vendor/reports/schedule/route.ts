import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendor = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const schedule = await prisma.reportschedule.findUnique({
      where: { vendorProfileId: vendor.id }
    });

    return NextResponse.json(schedule || {
      frequency: "MONTHLY",
      format: "PDF",
      recipientEmail: "",
      reportTypes: ["bookings", "revenue"],
      isActive: true
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { frequency, format, recipientEmail, reportTypes, isActive } = body;

    const vendor = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      include: { vendorsubscription: { include: { subscriptionplan: true } } }
    });

    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    // Verify subscription eligibility (Rank 2+)
    if ((vendor.vendorsubscription?.subscriptionplan?.rank || 0) < 2) {
      return NextResponse.json({ error: "Elite or Gold subscription required" }, { status: 403 });
    }

    const schedule = await prisma.reportschedule.upsert({
      where: { vendorProfileId: vendor.id },
      update: {
        frequency,
        format,
        recipientEmail,
        reportTypes,
        isActive,
        nextRun: calculateNextRun(frequency)
      },
      create: {
        vendorProfileId: vendor.id,
        frequency,
        format,
        recipientEmail,
        reportTypes,
        isActive,
        nextRun: calculateNextRun(frequency)
      }
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Schedule Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function calculateNextRun(frequency: string) {
  const next = new Date();
  if (frequency === "MONTHLY") {
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
  } else {
    next.setDate(next.getDate() + (7 - next.getDay() + 1) % 7 || 7); // Next Monday
  }
  next.setHours(8, 0, 0, 0); // Run at 8 AM
  return next;
}
