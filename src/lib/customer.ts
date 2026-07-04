import { prisma } from "@/lib/prisma";

export async function getCustomerStats(userId: string) {
  try {
    // Parallelize all independent Prisma calls
    const [activeBookingsCount, wishlistCount, wallet, recentBookings] = await Promise.all([
      prisma.booking.count({
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
        vendorName: b.vendorprofile.businessName,
        vendorLogo: b.vendorprofile.logo,
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
