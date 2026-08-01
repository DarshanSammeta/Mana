import { prisma } from "@/lib/prisma";

export class InvoiceService {
  /**
   * Generates a formal invoice object for a booking
   */
  static async generateInvoiceData(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customerprofile: {
          include: { user: true }
        },
        vendorprofile: { include: { user: true } },
        bookingitem: { include: { service: true, Renamedpackage: true } }
      }
    });

    if (!booking || !booking.customerprofile) throw new Error("Booking or profile not found");

    const customerUser = booking.customerprofile.user;

    const invoiceData = {
      invoiceNumber: `INV-${booking.bookingNumber}`,
      date: new Date().toISOString(),
      customer: {
        name: customerUser.fullName,
        email: customerUser.email,
        mobile: customerUser.mobileNumber,
        address: booking.eventLocation
      },
      vendor: {
        name: booking.vendorprofile?.businessName || "N/A",
        email: booking.vendorprofile?.user.email || "N/A",
        mobile: booking.vendorprofile?.user.mobileNumber || "N/A",
        gstin: booking.vendorprofile?.gstNumber || "N/A"
      },
      items: booking.bookingitem.map(item => ({
        description: item.Renamedpackage?.name || item.service.title,
        quantity: item.quantity,
        rate: item.price,
        amount: Number(item.price) * item.quantity
      })),
      summary: {
        subTotal: booking.subTotal,
        taxAmount: booking.taxAmount,
        platformFee: booking.commissionAmount,
        discount: booking.discountAmount,
        total: booking.totalAmount
      }
    };

    return invoiceData;
  }
}
