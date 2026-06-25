import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";

export async function GET(req: Request) {
  const payload = await getAuthPayload(req);
  if (!payload || payload.role !== "VENDOR") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });

    if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

    const recurring = await prisma.recurringavailability.findMany({
      where: { vendorProfileId: profile.id },
      orderBy: { dayOfWeek: 'asc' }
    });

    return NextResponse.json(recurring);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const payload = await getAuthPayload(req);
  if (!payload || payload.role !== "VENDOR") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rules } = await req.json(); // Array of { dayOfWeek, isAvailable, startTime, endTime }
    const profile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });

    if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

    await prisma.$transaction(
      rules.map((rule: any) =>
        prisma.recurringavailability.upsert({
          where: {
            vendorProfileId_dayOfWeek: {
              vendorProfileId: profile.id,
              dayOfWeek: rule.dayOfWeek,
            },
          },
          update: {
            isAvailable: rule.isAvailable,
            startTime: rule.startTime,
            endTime: rule.endTime,
          },
          create: {
            id: crypto.randomUUID(),
            vendorProfileId: profile.id,
            dayOfWeek: rule.dayOfWeek,
            isAvailable: rule.isAvailable,
            startTime: rule.startTime,
            endTime: rule.endTime,
          },
        })
      )
    );

    return NextResponse.json({ message: "Recurring availability updated" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
