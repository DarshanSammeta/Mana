import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ status: 403 });

    const { teamId, name, role, email, phone, avatar } = await req.json();

    const member = await prisma.vendor_team_member.create({
      data: {
        teamId,
        name,
        role,
        email,
        phone,
        avatar,
        status: "Active"
      }
    });

    return NextResponse.json(member);
  }, req);
}

export async function GET(req: Request) {
    return withErrorHandler(async () => {
        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get("teamId");

        if (!teamId) return NextResponse.json({ message: "teamId required" }, { status: 400 });

        const members = await prisma.vendor_team_member.findMany({
            where: { teamId },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(members);
    }, req);
}
