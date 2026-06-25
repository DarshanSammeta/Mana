import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // CREDIT, DEBIT, COMMISSION etc

  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId }
    });

    if (!wallet) {
      return NextResponse.json({ transactions: [] });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        walletId: wallet.id,
        ...(type ? { type: type as any } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        wallet: true,
        // Include booking and split info for credits
        ...(payload.role === 'VENDOR' ? {
          booking: {
            select: {
              bookingNumber: true,
              eventName: true,
              totalAmount: true,
              payment: {
                include: {
                  payment_split: true
                }
              }
            }
          }
        } : {})
      }
    });

    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
