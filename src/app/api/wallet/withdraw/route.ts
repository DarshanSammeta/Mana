import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
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

    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId },
    });

    if (!wallet) {
      return NextResponse.json({ message: "Wallet not found" }, { status: 404 });
    }

    if (Number(wallet.balance) < amount) {
      return NextResponse.json({ message: "Insufficient balance" }, { status: 400 });
    }

    // Start a transaction to update wallet and create payout/transaction records
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct from wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
        },
      });

      // 2. Create a Payout record
      const vendorProfile = await tx.vendorprofile.findUnique({
        where: { userId: payload.userId },
      });

      if (!vendorProfile) {
        throw new Error("Vendor profile not found");
      }

      const payoutId = crypto.randomUUID();
      const payout = await tx.payout.create({
        data: {
          id: payoutId,
          vendorId: vendorProfile.id,
          amount: amount,
          status: "PENDING",
          reference: `WD-${Date.now()}`,
        },
      });

      // 3. Create a Transaction record
      await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          walletId: wallet.id,
          amount: amount,
          type: "PAYOUT",
          status: "PENDING",
          description: `Withdrawal to bank account (${payout.reference})`,
          reference: payout.id,
        },
      });

      return { updatedWallet, payout };
    });

    return NextResponse.json({
      message: "Withdrawal request submitted successfully",
      balance: result.updatedWallet.balance,
    });
  } catch (error: any) {
    console.error("Withdrawal Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
