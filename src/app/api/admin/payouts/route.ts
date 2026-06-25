import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const payouts = await prisma.payout.findMany({
      where: status ? { status: status as any } : {},
      include: {
        vendorprofile: {
          select: {
            businessName: true,
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(payouts);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Release/Process Payout
export async function PATCH(req: Request) {
  try {
    const { payoutId, status, reference, notes } = await req.json();

    if (!payoutId || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { vendorprofile: true }
    });

    if (!payout) {
      return NextResponse.json({ message: "Payout not found" }, { status: 404 });
    }

    const updatedPayout = await prisma.$transaction(async (tx) => {
      const p = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: status,
          reference: reference,
          notes: notes,
          processedAt: status === "RELEASED" ? new Date() : null
        }
      });

      // If released, we move money from Pending to Balance/Lifetime in Wallet
      if (status === "RELEASED") {
         await tx.wallet.update({
           where: { userId: payout.vendorprofile.userId },
           data: {
             pendingBalance: { decrement: p.amount },
             lifetimeEarnings: { increment: p.amount }
           }
         });

         await tx.transaction.create({
           data: {
             id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
             walletId: (await tx.wallet.findUnique({ where: { userId: payout.vendorprofile.userId } }))!.id,
             amount: p.amount,
             type: "PAYOUT",
             status: "COMPLETED",
             description: `Payout released: ${reference || p.id}`,
             reference: reference
           }
         });
      }

      return p;
    });

    return NextResponse.json(updatedPayout);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
