import "server-only";
import { getPrisma } from "@/lib/prisma";
import { generateAndUploadInvoice } from "@/lib/pdf/generator";

export class DocumentService {
  /**
   * Generates and archives a document for a booking.
   * Ensures snapshots are immutable once created.
   */
  static async generateDocument(bookingId: string, type: "INVOICE" | "AGREEMENT" | "RECEIPT", name: string) {
    const prisma = getPrisma();

    // 1. Fetch full booking details for snapshot
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customerprofile: { include: { user: true } },
        vendorprofile: true,
        bookingitem: { include: { service: true, Renamedpackage: true } },
        booking_addon: true
      }
    });

    if (!booking) throw new Error("Booking not found");

    // 2. Generate PDF and Upload to Storage (using existing generator as base)
    const uploadResult = await generateAndUploadInvoice(booking);

    // 3. Create Document Record with snapshot
    const doc = await prisma.booking_document.create({
      data: {
        bookingId,
        type,
        name,
        url: uploadResult.pdfUrl,
        snapshot: (booking.snapshot as any) || {}
      }
    });

    // 4. Update Audit Log
    await prisma.audit_log.create({
        data: {
            bookingId,
            entityType: "DOCUMENT",
            entityId: doc.id,
            action: "DOCUMENT_GENERATED",
            module: "BOOKING_OPERATIONS",
            newValue: { type, docId: doc.id },
            performedByRole: "SYSTEM"
        }
    });

    return doc;
  }

  /**
   * Fetches all documents associated with a booking.
   */
  static async getBookingDocuments(bookingId: string) {
    const prisma = getPrisma();
    return await prisma.booking_document.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" }
    });
  }
}
