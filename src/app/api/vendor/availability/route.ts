import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { date, isAvailable, startTime, endTime, bookingLimit } = await req.json();

    const profile = await prisma.vendorprofile.findUnique({ where: { userId: payload.userId } });
    if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const existing = await prisma.availability.findFirst({
        where: {
            vendorProfileId: profile.id,
            date: targetDate
        }
    });

    if (existing) {
        await prisma.availability.update({
            where: { id: existing.id },
            data: { isAvailable, startTime, endTime, bookingLimit: bookingLimit ?? existing.bookingLimit }
        });
    } else {
        await prisma.availability.create({
            data: {
                id: crypto.randomUUID(),
                vendorProfileId: profile.id,
                date: targetDate,
                isAvailable,
                startTime,
                endTime,
                bookingLimit: bookingLimit ?? 1
            }
        });
    }

    // Trigger real-time update
    const io = (global as any).io;
    if (io) {
      io.emit("vendor:availability_updated", { vendorId: profile.id, date });
    }

    return NextResponse.json({ message: "Availability updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad Request";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  const payload = verifyAccessToken(token || "");
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const availability = await prisma.availability.findMany({
      where: { vendorprofile: { userId: payload.userId } },
    });
    return NextResponse.json(availability);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
