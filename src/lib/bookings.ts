import { prisma } from "@/lib/prisma";

export async function getBookingDetails(bookingId: string, userId: string, role: string) {
  const where: any = { id: bookingId };

  if (role === "CUSTOMER") {
    where.customerId = userId;
  } else if (role === "VENDOR") {
    const vendorProfile = await prisma.vendorprofile.findUnique({ where: { userId } });
    if (!vendorProfile) return null;
    where.vendorId = vendorProfile.id;
  }

  const booking = await prisma.booking.findFirst({
    where,
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          mobileNumber: true
        }
      },
      vendorprofile: {
        select: {
          businessName: true,
          logo: true,
          advanceBookingDays: true,
          minBookingNotice: true,
          bufferTime: true
        }
      },
      bookingitem: {
        include: {
          service: true,
          Renamedpackage: true
        }
      },
      payment: true
    }
  });

  if (!booking) return null;

  // Manual transform because schema is different from what UI expects
  const transformedBooking = {
    ...booking,
    vendorPhoneVerified: true, // Placeholder until schema matches
    vendorConfirmedAt5d: booking.vendorConfirmedAt5d,
    checklist: [], // Placeholder until schema matches
  };

  return transformedBooking;
}

export async function getBookingTeam(bookingId: string) {
  return await prisma.staff.findMany({
    where: { bookingId }
  });
}
