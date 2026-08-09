import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { customer_id, amount, type, note } = body;

    if (!customer_id || !amount || !type) {
        return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
            where: { userId: customer_id }
        });

        if (!wallet) throw new Error("Wallet not found for user");

        const updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
                balance: { increment: amount },
                withdrawable: type === 'REFUND' ? { increment: amount } : undefined
            }
        });

        const transaction = await tx.transaction.create({
            data: {
                id: crypto.randomUUID(),
                walletId: wallet.id,
                amount,
                type: type,
                status: "COMPLETED",
                description: note || `Admin ${type.toLowerCase()}`,
            }
        });

        return { wallet: updatedWallet, transaction };
    });

    return NextResponse.json(result);
  }, req);
}
