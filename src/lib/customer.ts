import { prisma } from "@/lib/prisma";

import { booking_status } from "@prisma/client";

export async function getCustomerStats(userId: string) {
  try {
    // Parallelize all independent Prisma calls
    const [activeBookingsCount, wishlistCount, wallet, recentBookings] = await Promise.all([
      prisma.booking.count({
        where: {
          customerId: userId,
          status: {
            in: [
              booking_status.PENDING,
              booking_status.QUOTE_ACCEPTED,
              booking_status.CONFIRMED,
              booking_status.VENDOR_ASSIGNED,
              booking_status.VENDOR_TRAVELING,
              booking_status.VENDOR_ARRIVED,
              booking_status.OTP_VERIFICATION_PENDING,
              booking_status.EVENT_STARTED,
              booking_status.EVENT_ONGOING
            ]
          }
        }
      }),
      prisma.wishlistitem.count({
        where: {
          wishlist: { userId }
        }
      }),
      prisma.wallet.findUnique({
        where: { userId }
      }),
      prisma.booking.findMany({
        where: { customerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          bookingNumber: true,
          eventDate: true,
          status: true,
          totalAmount: true,
          vendorprofile: {
            select: {
              businessName: true,
              logo: true
            }
          },
          bookingitem: {
            select: {
              service: {
                select: { title: true }
              }
            }
          }
        }
      })
    ]);

    return {
      activeBookings: activeBookingsCount,
      wishlistCount: wishlistCount,
      walletBalance: Number(wallet?.balance || 0),
      totalSpending: Number(wallet?.lifetimeSpending || 0),
      recentBookings: recentBookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        vendorName: b.vendorprofile?.businessName || "Unknown Vendor",
        vendorLogo: b.vendorprofile?.logo || null,
        eventDate: b.eventDate.toISOString(), // Ensure ISO string for serialization
        status: b.status,
        totalAmount: Number(b.totalAmount),
        serviceTitle: b.bookingitem[0]?.service.title || "Event Service"
      }))
    };
  } catch (error: any) {
    console.error("Error fetching customer stats:", error);
    throw error;
  }
}
