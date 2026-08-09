import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customer_id");

    const where: any = {};
    if (customerId) {
        where.wallet = { userId: customerId };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
          wallet: {
              include: { user: { select: { fullName: true, email: true } } }
          }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return NextResponse.json(transactions);
  }, req);
}
