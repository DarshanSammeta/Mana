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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

interface RecurringRule {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  bookingLimit?: number;
}

export async function POST(req: Request) {
  const payload = await getAuthPayload(req);
  if (!payload || payload.role !== "VENDOR") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rules }: { rules: RecurringRule[] } = await req.json(); // Array of { dayOfWeek, isAvailable, startTime, endTime, bookingLimit }
    const profile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });

    if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

    await prisma.$transaction(
      rules.map((rule) =>
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
            bookingLimit: rule.bookingLimit ?? 1,
          },
          create: {
            id: crypto.randomUUID(),
            vendorProfileId: profile.id,
            dayOfWeek: rule.dayOfWeek,
            isAvailable: rule.isAvailable,
            startTime: rule.startTime,
            endTime: rule.endTime,
            bookingLimit: rule.bookingLimit ?? 1,
          },
        })
      )
    );

    return NextResponse.json({ message: "Recurring availability updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad Request";
    return NextResponse.json({ message }, { status: 400 });
  }
}
