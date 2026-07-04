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
  const limit = parseInt(searchParams.get("limit") || "20");
  const cursor = searchParams.get("cursor");

  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId }
    });

    if (!wallet) {
      return NextResponse.json({ items: [], nextCursor: null });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        walletId: wallet.id,
        ...(type ? { type: type as any } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      select: {
        id: true,
        walletId: true,
        amount: true,
        type: true,
        status: true,
        description: true,
        reference: true,
        createdAt: true,
        // Include booking and split info for credits
        ...(payload.role === 'VENDOR' ? {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              eventName: true,
              totalAmount: true,
              payment: {
                select: {
                  id: true,
                  status: true,
                  amount: true,
                  payment_split: {
                    select: {
                      id: true,
                      entityId: true,
                      amount: true,
                      type: true,
                      status: true
                    }
                  }
                }
              }
            }
          }
        } : {})
      }
    });

    let nextCursor: typeof cursor | undefined = undefined;
    if (transactions.length > limit) {
      const nextItem = transactions.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
      items: transactions,
      nextCursor
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
