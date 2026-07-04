import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(_req: Request) {
  try {
    const settings = await prisma.globalsettings.findMany();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  // Only Admin should be able to update global settings
  // Assuming role check for ADMIN exists or using a specific check
  if (!payload || payload.role !== "ADMIN" as any) return NextResponse.json({ status: 403 });

  try {
    const { key, value, description } = await req.json();

    const setting = await prisma.globalsettings.upsert({
      where: { key },
      update: { value, description },
      create: {
        id: crypto.randomUUID(),
        key,
        value,
        description
      }
    });

    return NextResponse.json(setting);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
