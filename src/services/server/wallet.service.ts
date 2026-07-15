import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("wallet.service can only be used on the server.");
}

export class WalletService {
  static async getWallet(userId: string) {
    const prisma = getPrisma();
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transaction: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0, pendingBalance: 0, withdrawable: 0 },
        include: { transaction: true }
      });
    }

    return wallet;
  }

  static async addCredits(userId: string, amount: number, description: string, reference?: string) {
    const prisma = getPrisma();
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: { increment: amount },
          lifetimeEarnings: { increment: amount }
        }
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: "CREDIT",
          description,
          reference,
          status: "COMPLETED"
        }
      });

      return wallet;
    });
  }

  static async deductCredits(userId: string, amount: number, description: string, reference?: string) {
    const prisma = getPrisma();
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || Number(wallet.balance) < amount) {
        throw new Error("Insufficient wallet balance");
      }

      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: amount },
          lifetimeSpending: { increment: amount }
        }
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: "DEBIT",
          description,
          reference,
          status: "COMPLETED"
        }
      });

      return updatedWallet;
    });
  }
}
