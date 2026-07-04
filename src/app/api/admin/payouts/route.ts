import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";
import { payout_status } from "@prisma/client";

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const payouts = await prisma.payout.findMany({
      where: status ? { status: status as payout_status } : {},
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
  });
}

// Release/Process Payout
export async function PATCH(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

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
         const wallet = await tx.wallet.findUnique({ where: { userId: payout.vendorprofile.userId } });
         if (!wallet) throw new Error("Wallet not found for vendor");

         await tx.wallet.update({
           where: { id: wallet.id },
           data: {
             pendingBalance: { decrement: p.amount },
             lifetimeEarnings: { increment: p.amount }
           }
         });

         await tx.transaction.create({
           data: {
             id: crypto.randomUUID(),
             walletId: wallet.id,
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

    logger.info("Payout updated by admin", { adminId: admin.userId, payoutId, status });

    return NextResponse.json(updatedPayout);
  });
}
