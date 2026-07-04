import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ status: 403 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const cursor = searchParams.get("cursor");

  try {
    const userId = payload.userId;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      // Initialize wallet if not exists
      const newWallet = await prisma.wallet.create({
        data: {
          id: `w_${userId.substring(0, 8)}`,
          userId,
          balance: 0,
          pendingBalance: 0,
          withdrawable: 0,
          lifetimeEarnings: 0,
          lifetimeSpending: 0,
          type: 'USER'
        }
      });
      return NextResponse.json({ ...newWallet, items: [], nextCursor: null });
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    let nextCursor: typeof cursor | undefined = undefined;
    if (transactions.length > limit) {
      const nextItem = transactions.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
        ...wallet,
        items: transactions,
        nextCursor
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
