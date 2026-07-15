import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { InvoiceTemplate } from './InvoiceTemplate';
import { getCloudinary } from '@/lib/cloudinary.server';

export async function generateAndUploadInvoice(booking: any) {
  const cloudinary = getCloudinary();
  if (!cloudinary) {
    throw new Error("Cloudinary instance not available");
  }

  try {
    // 1. Prepare data for the template
    const invoiceData = {
      invoiceNumber: `INV-${booking.bookingNumber.split('-').pop()}-${Date.now().toString().slice(-4)}`,
      createdAt: new Date(),
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
      items: booking.bookingitem.map((item: any) => ({
        serviceName: item.service.title,
        packageName: item.Renamedpackage?.name,
        price: item.price
      })),
      subTotal: booking.subTotal,
      taxAmount: booking.taxAmount,
      discountAmount: booking.discountAmount,
      totalAmount: booking.totalAmount
    };

    // 2. Render to Buffer
    const buffer = await renderToBuffer(<InvoiceTemplate data={invoiceData} />);

    // 3. Upload to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        resource_type: 'raw',
        folder: 'mana_events/invoices',
        public_id: invoiceData.invoiceNumber,
        format: 'pdf'
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(buffer);
    });

    return {
      invoiceNumber: invoiceData.invoiceNumber,
      pdfUrl: uploadResult.secure_url
    };
  } catch (error) {
    console.error('Invoice generation/upload failed:', error);
    throw error;
  }
}
