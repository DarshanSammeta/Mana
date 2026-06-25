import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";
import { emitSocketEvent } from "@/lib/socket-helper";

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

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
    });

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    const payouts = await prisma.payout.findMany({
      where: { vendorId: vendorProfile.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(payouts);
  } catch (error: any) {
    console.error("Payouts Fetch Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { amount } = await req.json();
    const withdrawAmount = new Decimal(amount);

    if (withdrawAmount.lte(0)) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendorprofile.findUnique({
        where: { userId: payload.userId },
        include: {
          user: {
            include: { wallet: true }
          }
        }
      });

      if (!vendor || !vendor.user?.wallet) {
        throw new Error("Vendor or wallet not found");
      }

      const wallet = vendor.user.wallet;

      if (wallet.withdrawable.lt(withdrawAmount)) {
        throw new Error("Insufficient withdrawable balance");
      }

      if (!vendor.bankDetails) {
        throw new Error("Bank details not found. Please add them in settings.");
      }

      // 1. Create Payout Record
      const payout = await tx.payout.create({
        data: {
          id: crypto.randomUUID(),
          vendorId: vendor.id,
          amount: withdrawAmount,
          status: "PENDING",
          bankDetails: vendor.bankDetails as any,
          notes: "Manual withdrawal request",
          updatedAt: new Date()
        }
      });

      // 2. Update Wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          withdrawable: { decrement: withdrawAmount }
        }
      });

      // 3. Create Transaction
      await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          walletId: wallet.id,
          amount: withdrawAmount,
          type: "PAYOUT",
          status: "PENDING",
          description: `Withdrawal request for ₹${withdrawAmount}`,
          reference: payout.id
        }
      });

      return payout;
    });

    // Real-time notification
    emitSocketEvent(payload.userId, "wallet:updated", {
      type: "PAYOUT_REQUESTED",
      amount: withdrawAmount,
      status: "PENDING"
    });

    return NextResponse.json({ message: "Withdrawal request submitted", payout: result });
  } catch (error: any) {
    console.error("Payout Request Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
