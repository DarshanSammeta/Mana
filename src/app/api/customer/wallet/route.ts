import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ status: 403 });

  try {
    const userId = payload.userId;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transaction: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
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
        },
        include: { transaction: true }
      });
      return NextResponse.json(newWallet);
    }

    return NextResponse.json(wallet);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
