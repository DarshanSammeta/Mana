import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { mediaUrl, mediaType, title, description, serviceId } = await req.json();

    const profile = await prisma.vendorprofile.findUnique({ where: { userId: payload.userId } });
    if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

    const portfolioItem = await prisma.portfolio.create({
      data: {
        id: crypto.randomUUID(),
        vendorProfileId: profile.id,
        serviceId,
        mediaUrl,
        mediaType,
        title,
        description,
      },
    });

    return NextResponse.json(portfolioItem, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad Request";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const items = await prisma.portfolio.findMany({
      where: { vendorprofile: { userId: payload.userId } },
    });
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
