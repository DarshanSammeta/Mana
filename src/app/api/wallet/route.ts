import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";

const WALLET_SELECT = {
  id: true,
  userId: true,
  balance: true,
  pendingBalance: true,
  withdrawable: true,
  lifetimeEarnings: true,
  lifetimeSpending: true,
  type: true,
  user: {
    select: {
      vendorprofile: {
        select: {
          bankDetails: true,
          businessName: true
        }
      }
    }
  },
  transaction: {
    take: 10,
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      amount: true,
      type: true,
      status: true,
      description: true,
      reference: true,
      createdAt: true
    }
  },
};

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId },
      select: WALLET_SELECT,
    });

    if (!wallet) {
      // Initialize wallet if it doesn't exist
      wallet = await prisma.wallet.create({
        data: {
          id: crypto.randomUUID(),
          userId: payload.userId,
          balance: 0,
          pendingBalance: 0,
          withdrawable: 0,
          lifetimeEarnings: 0,
          lifetimeSpending: 0,
          type: "USER",
        },
        select: WALLET_SELECT,
      });
    }

    // Use a clean response object to avoid 'any' casting
    const responseData = {
      ...wallet,
      bankDetails: wallet.user?.vendorprofile?.bankDetails || null
    };

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error("Wallet Fetch Error", { error });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
