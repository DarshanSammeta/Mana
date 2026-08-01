import { prisma } from "@/lib/prisma";

export class BookingAuthService {
  /**
   * Verifies if a user has access to a specific booking.
   * Customers can see their own bookings.
   * Vendors can see bookings assigned to them.
   * Admins can see all.
   */
  static async canAccess(bookingId: string, userId: string, role: string) {
    if (role === "ADMIN") return true;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customerprofile: { select: { userId: true } },
        vendorprofile: { select: { userId: true } }
      }
    });

    if (!booking) return false;

    if (role === "CUSTOMER") {
      return booking.customerprofile?.userId === userId;
    }

    if (role === "VENDOR") {
      return booking.vendorprofile?.userId === userId;
    }

    return false;
  }

  /**
   * Specifically checks if the user is the VENDOR assigned to this booking.
   */
  static async isAssignedVendor(bookingId: string, userId: string) {
      const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { vendorprofile: { select: { userId: true } } }
      });
      return booking?.vendorprofile?.userId === userId;
  }
}
