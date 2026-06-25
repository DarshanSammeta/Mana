import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "CUSTOMER") return NextResponse.json({ status: 403 });

  try {
    const userId = payload.userId;

    // Get basic counts
    const activeBookingsCount = await prisma.booking.count({
      where: {
        customerId: userId,
        status: {
          in: [
            'PENDING',
            'ACCEPTED',
            'CONFIRMED',
            'VENDOR_ASSIGNED',
            'VENDOR_TRAVELING',
            'VENDOR_ARRIVED',
            'OTP_VERIFICATION_PENDING',
            'EVENT_STARTED',
            'EVENT_ONGOING'
          ]
        }
      }
    });

    const wishlistCount = await prisma.wishlistitem.count({
      where: {
        wishlist: { userId }
      }
    });

    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    // Recent bookings for the dashboard
    const recentBookings = await prisma.booking.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        vendorprofile: {
          select: {
            businessName: true,
            logo: true
          }
        },
        bookingitem: {
          include: {
            service: {
              select: { title: true }
            }
          }
        }
      }
    });

    const stats = {
      activeBookings: activeBookingsCount,
      wishlistCount: wishlistCount,
      walletBalance: wallet?.balance || 0,
      totalSpending: wallet?.lifetimeSpending || 0,
      recentBookings: recentBookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        vendorName: b.vendorprofile.businessName,
        vendorLogo: b.vendorprofile.logo,
        eventDate: b.eventDate,
        status: b.status,
        totalAmount: b.totalAmount,
        serviceTitle: b.bookingitem[0]?.service.title || "Event Service"
      }))
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Customer Stats Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
