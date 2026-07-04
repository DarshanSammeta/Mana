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
    const pkg = await prisma.renamedpackage.findUnique({
        where: { id: id },
        include: { service: { include: { vendorprofile: true } } }
    });

    if (!pkg || pkg.service.vendorprofile.userId !== payload.userId) {
        return NextResponse.json({ message: "Not authorized to delete this package" }, { status: 403 });
    }

    await prisma.renamedpackage.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Package deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad Request";
    return NextResponse.json({ message }, { status: 400 });
  }
}
