import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ status: 403 });

  try {
    const userId = payload.userId;

    const invoices = await prisma.invoice.findMany({
      where: {
        booking: { customerId: userId }
      },
      include: {
        booking: {
          select: {
            bookingNumber: true,
            totalAmount: true,
            eventDate: true,
            vendorprofile: {
              select: { businessName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
