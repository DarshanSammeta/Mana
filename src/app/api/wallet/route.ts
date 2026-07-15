import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    let wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId },
      include: {
        transaction: {
          orderBy: { createdAt: "desc" },
          take: 50
        }
      }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          id: crypto.randomUUID(),
          userId: payload.userId,
          balance: 0,
          type: payload.role === "VENDOR" ? "VENDOR" : "USER"
        },
        include: {
            transaction: true
        }
      });
    }

    return NextResponse.json(wallet);
  });
}
