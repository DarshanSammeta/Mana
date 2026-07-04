import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const item = await prisma.portfolio.findUnique({
        where: { id: id },
        include: { vendorprofile: true }
    });

    if (!item || item.vendorprofile.userId !== payload.userId) {
        return NextResponse.json({ message: "Not authorized to delete this item" }, { status: 403 });
    }

    await prisma.portfolio.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Portfolio item deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad Request";
    return NextResponse.json({ message }, { status: 400 });
  }
}
