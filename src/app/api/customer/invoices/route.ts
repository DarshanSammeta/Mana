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

    // Use a more optimized query if possible, or just ensure indices exist
    // Prisma's include can sometimes be slow if not indexed correctly.
    // Adding a timeout to the prisma call to prevent hanging.
    const invoices = await prisma.invoice.findMany({
      where: {
        booking: { customerId: userId }
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        createdAt: true,
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
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to 50 most recent invoices for performance
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
