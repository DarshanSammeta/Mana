import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return withErrorHandler(async () => {
      const { id } = await params;
      const admin = await verifyAdminRequest(req);
      if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      const body = await req.json();
      const { status, remarks } = body;

      const updated = await prisma.vendor_payout.update({
          where: { id },
          data: {
              status: status.toUpperCase() as any,
              notes: remarks
          }
      });

      return NextResponse.json(updated);
    }, req);
}
