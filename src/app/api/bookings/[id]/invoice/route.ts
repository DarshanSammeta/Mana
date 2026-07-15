import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { InvoiceService } from "@/services/server/invoice.service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // Authorization: Customer, Vendor, or Admin
    if (payload.role !== "ADMIN" && booking.customerId !== payload.userId) {
        // Check if it's the vendor
        const vendor = await prisma.vendorprofile.findUnique({ where: { userId: payload.userId } });
        if (booking.vendorId !== vendor?.id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
    }

    const invoice = await InvoiceService.generateInvoiceData(bookingId);
    return NextResponse.json(invoice);
  });
}
