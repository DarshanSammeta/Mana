import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function getCommissionRate(vendorId: string, categoryId: string) {
  // 1. Check Vendor specific commission
  const vendor = await prisma.vendorprofile.findUnique({
    where: { id: vendorId },
    select: { commissionRate: true }
  });

  if (vendor?.commissionRate) {
    return vendor.commissionRate;
  }

  // 2. Check Category specific commission
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { commissionRate: true }
  });

  if (category?.commissionRate) {
    return category.commissionRate;
  }

  // 3. Fallback to Global Settings
  const globalSetting = await prisma.globalsettings.findUnique({
    where: { key: 'GLOBAL_COMMISSION_RATE' }
  });

  return new Decimal(globalSetting?.value || "10.00");
}

export async function calculateRevenue(amount: number | Decimal, commissionRate: number | Decimal) {
  const total = new Decimal(amount);
  const rate = new Decimal(commissionRate);

  const commissionAmount = total.mul(rate).div(100);
  const vendorPayout = total.minus(commissionAmount);

  return {
    total,
    commissionRate: rate,
    commissionAmount,
    vendorPayout
  };
}

export async function updateWalletBalance(
  userId: string,
  amount: number | Decimal,
  type: 'CREDIT' | 'DEBIT',
  transactionType: 'CREDIT' | 'DEBIT' | 'COMMISSION' | 'REFUND' | 'PAYOUT',
  description: string,
  bookingId?: string
) {
  const amountDecimal = new Decimal(amount);

  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      update: {
        balance: {
          increment: type === 'CREDIT' ? amountDecimal : amountDecimal.negated()
        },
      },
      create: {
        id: crypto.randomUUID(),
        userId,
        balance: type === 'CREDIT' ? amountDecimal : amountDecimal.negated(),
        type: 'USER', // Default, should be handled based on user role if needed
      }
    });

    await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        walletId: wallet.id,
        amount: amountDecimal,
        type: transactionType,
        description,
        bookingId,
      }
    });

    return wallet;
  });
}
