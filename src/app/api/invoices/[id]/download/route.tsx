import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceTemplate } from '@/lib/pdf/InvoiceTemplate';
import React from 'react';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        vendorprofile: {
          include: {
            user: true
          }
        },
        bookingitem: {
          include: {
            service: true,
            Renamedpackage: true
          }
        },
        invoice: true
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Prepare data for PDF
    const invoiceData = {
      invoiceNumber: booking.invoice?.invoiceNumber || `INV-${booking.bookingNumber}`,
      createdAt: booking.invoice?.createdAt || booking.createdAt,
      customerName: booking.user.fullName,
      customerEmail: booking.user.email,
      customerPhone: booking.user.mobileNumber,
      vendorName: booking.vendorprofile?.businessName || 'N/A',
      vendorCity: booking.vendorprofile?.city || '',
      vendorState: booking.vendorprofile?.state || '',
      vendorGst: booking.vendorprofile?.gstNumber || 'N/A',
      eventName: booking.eventName,
      eventType: booking.eventType,
      eventLocation: booking.eventLocation,
      eventDate: booking.eventDate,
      items: booking.bookingitem.map(item => ({
        serviceName: item.service.title,
        packageName: item.Renamedpackage?.name,
        price: item.price.toString()
      })),
      subTotal: booking.subTotal.toString(),
      taxAmount: booking.taxAmount.toString(),
      discountAmount: booking.discountAmount.toString(),
      totalAmount: booking.totalAmount.toString()
    };

    const buffer = await renderToBuffer(<InvoiceTemplate data={invoiceData} />);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Invoice-${invoiceData.invoiceNumber}.pdf`,
      },
    });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
