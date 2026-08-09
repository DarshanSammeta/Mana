import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return withErrorHandler(async () => {
      const { id } = await params;
      const admin = await verifyAdminRequest(req);
      if (!admin || admin.role !== 'SUPER_ADMIN') {
          return NextResponse.json({ message: "Only Super Admins can delete packages" }, { status: 403 });
      }

      await prisma.renamedpackage.delete({
          where: { id }
      });

      return NextResponse.json({ success: true });
    }, req);
}
