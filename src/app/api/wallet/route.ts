import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

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
      include: {
        user: {
          include: {
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
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (wallet) {
      // Flatten bankDetails into the wallet object for easier frontend consumption
      (wallet as any).bankDetails = (wallet as any).user?.vendorprofile?.bankDetails;
    }

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
        include: {
          transaction: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
          user: {
            include: {
              vendorprofile: {
                select: {
                  bankDetails: true,
                  businessName: true
                }
              }
            }
          },
        },
      });
    }

    return NextResponse.json(wallet);
  } catch (error: any) {
    console.error("Wallet Fetch Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
