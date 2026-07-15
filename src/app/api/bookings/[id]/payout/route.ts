import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { calculateRevenue, getCommissionRate } from "@/lib/revenue";
import logger from "@/lib/logger";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "CUSTOMER") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id },
      include: {
        vendorprofile: true,
        bookingitem: {
          include: {
            service: {
              include: {
                servicetype: {
                  include: {
                    subcategory: true
                  }
                }
              }
            }
          }
        }
      },
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.customerId !== payload.userId) return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    if (booking.status !== "EVENT_COMPLETED") return NextResponse.json({ message: "Event not completed" }, { status: 400 });

    // Calculate commission and payout
    const firstItem = booking.bookingitem[0];
    const categoryId = firstItem?.service.servicetype.subcategory.categoryId;

    const rate = await getCommissionRate(booking.vendorId!, categoryId!);
    const revenue = await calculateRevenue(booking.totalAmount, rate);

    // Update Wallet and create transactions in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update Vendor Pending to Withdrawable (Assuming it was pending)
      // For simplicity here, we'll just credit the vendor wallet
      const vendorWallet = await tx.wallet.upsert({
        where: { userId: booking.vendorprofile?.userId },
        update: {
          balance: { increment: revenue.vendorPayout },
          withdrawable: { increment: revenue.vendorPayout },
          lifetimeEarnings: { increment: revenue.vendorPayout }
        },
        create: {
          id: crypto.randomUUID(),
          userId: booking.vendorprofile?.userId || '',
          balance: revenue.vendorPayout,
          withdrawable: revenue.vendorPayout,
          lifetimeEarnings: revenue.vendorPayout,
          type: 'VENDOR'
        }
      });

      // 2. Create Transaction for Vendor
      await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          walletId: vendorWallet.id,
          bookingId: booking.id,
          amount: revenue.vendorPayout,
          type: 'CREDIT',
          description: `Payout for booking #${booking.bookingNumber}`,
          status: 'COMPLETED'
        }
      });

      // 3. Update Platform Wallet (Commission)
      const platformWallet = await tx.wallet.findFirst({
        where: { type: 'PLATFORM' }
      });

      if (platformWallet) {
        await tx.wallet.update({
          where: { id: platformWallet.id },
          data: {
            balance: { increment: revenue.commissionAmount },
            lifetimeEarnings: { increment: revenue.commissionAmount }
          }
        });
      } else {
        await tx.wallet.create({
          data: {
            id: crypto.randomUUID(),
            type: 'PLATFORM',
            balance: revenue.commissionAmount,
            lifetimeEarnings: revenue.commissionAmount
          }
        });
      }

      const currentPlatformWallet = platformWallet || await tx.wallet.findFirst({ where: { type: 'PLATFORM' } });

      // 4. Create Transaction for Platform
      await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          walletId: currentPlatformWallet!.id,
          bookingId: booking.id,
          amount: revenue.commissionAmount,
          type: 'COMMISSION',
          description: `Commission for booking #${booking.bookingNumber}`,
          status: 'COMPLETED'
        }
      });

      // 5. Create Payout Record
      await tx.payout.create({
        data: {
          id: crypto.randomUUID(),
          vendorId: booking.vendorId!,
          amount: revenue.vendorPayout,
          status: 'RELEASED',
          processedAt: new Date()
        }
      });

      // 6. Update Booking with financial details
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          commissionRate: rate,
          commissionAmount: revenue.commissionAmount,
          vendorPayout: revenue.vendorPayout
        }
      });
    });

    return NextResponse.json({ message: "Payout released successfully" });
  } catch (error) {
    logger.error("Error releasing payout", { error, bookingId: resolvedParams.id });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
