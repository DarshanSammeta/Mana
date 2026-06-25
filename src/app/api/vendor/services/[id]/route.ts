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
    const service = await prisma.service.findUnique({
        where: { id: id },
        include: { vendorprofile: true }
    });

    if (!service || service.vendorprofile.userId !== payload.userId) {
        return NextResponse.json({ message: "Not authorized to delete this service" }, { status: 403 });
    }

    // This might fail if there are active bookings, we should handle that
    await prisma.service.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Service deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
