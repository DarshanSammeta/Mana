import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const preferences = await prisma.notification_preference.findMany({
      where: { userId: payload.userId }
    });

    return NextResponse.json(preferences);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { category, email, sms, push } = await req.json();

    const preference = await prisma.notification_preference.upsert({
      where: {
        userId_category: {
          userId: payload.userId,
          category
        }
      },
      update: {
        email,
        sms,
        push
      },
      create: {
        id: crypto.randomUUID(),
        userId: payload.userId,
        category,
        email,
        sms,
        push
      }
    });

    return NextResponse.json(preference);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
