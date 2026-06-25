import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    const payouts = await prisma.payout.findMany({
      where: { vendorId: vendorProfile.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(payouts);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, amount, bankDetails } = await req.json();

    if (!userId || !amount) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            wallet: true
          }
        }
      }
    });

    const wallet = vendorProfile?.user?.wallet;

    if (!vendorProfile || !wallet) {
      return NextResponse.json({ message: "Vendor wallet not found" }, { status: 404 });
    }

    const withdrawalAmount = new Decimal(amount);

    // Check if vendor has enough balance (using 'balance' or 'withdrawable')
    if (wallet.balance.lt(withdrawalAmount)) {
      return NextResponse.json({ message: "Insufficient balance" }, { status: 400 });
    }

    const payout = await prisma.$transaction(async (tx) => {
      // 1. Create Payout Request
      const p = await tx.payout.create({
        data: {
          id: crypto.randomUUID(),
          vendorId: vendorProfile.id,
          amount: withdrawalAmount,
          status: "PENDING",
          bankDetails: bankDetails || vendorProfile.bankDetails,
          updatedAt: new Date(),
        }
      });

      // 2. Deduct from Wallet Balance and move to Pending Payout
      // Note: We use balance for withdrawable funds in this logic
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: withdrawalAmount },
          pendingBalance: { increment: withdrawalAmount }
        }
      });

      // 3. Create Transaction Record
      await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          walletId: wallet.id,
          amount: withdrawalAmount,
          type: "PAYOUT",
          status: "PENDING",
          description: `Withdrawal request created: ${p.id}`,
        }
      });

      return p;
    });

    return NextResponse.json(payout);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
