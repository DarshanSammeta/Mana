import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type ReportType = "bookings" | "revenue" | "transactions" | "withdrawals" | "taxes";

export async function getReportData(vendorId: string, type: ReportType, startDate: Date, endDate: Date) {
  const vendor = await prisma.vendorprofile.findUnique({
    where: { id: vendorId },
    select: { id: true, businessName: true, user: { select: { wallet: { select: { id: true } } } } }
  });

  if (!vendor) throw new Error("Vendor not found");

  let data: any[] = [];

  switch (type) {
    case "bookings":
      const bookings = await prisma.booking.findMany({
        where: {
          vendorId: vendor.id,
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          bookingNumber: true,
          createdAt: true,
          status: true,
          totalAmount: true,
          eventDate: true,
          eventName: true,
          city: true,
          user: { select: { fullName: true } }
        },
        orderBy: { createdAt: "desc" }
      });
      data = bookings.map(b => ({
        "Booking #": b.bookingNumber,
        "Date": b.createdAt.toLocaleDateString(),
        "Customer": b.user.fullName,
        "Event": b.eventName || "N/A",
        "Event Date": b.eventDate.toLocaleDateString(),
        "City": b.city || "N/A",
        "Amount": Number(b.totalAmount),
        "Status": b.status
      }));
      break;

    case "revenue":
      const splits = await prisma.payment_split.findMany({
        where: {
          vendorId: vendor.id,
          createdAt: { gte: startDate, lte: endDate }
        },
        include: {
          booking: { select: { bookingNumber: true } }
        },
        orderBy: { createdAt: "desc" }
      });
      data = splits.map(s => ({
        "Date": s.createdAt.toLocaleDateString(),
        "Booking #": s.booking.bookingNumber,
        "Total Amount": Number(s.totalAmount),
        "Admin Commission": Number(s.adminShare),
        "Vendor Share": Number(s.vendorShare),
        "Status": s.status
      }));
      break;

    case "transactions":
      if (vendor.user.wallet?.id) {
        const transactions = await prisma.transaction.findMany({
          where: {
            walletId: vendor.user.wallet.id,
            createdAt: { gte: startDate, lte: endDate }
          },
          orderBy: { createdAt: "desc" }
        });
        data = transactions.map(t => ({
          "Date": t.createdAt.toLocaleDateString(),
          "Type": t.type,
          "Amount": Number(t.amount),
          "Status": t.status,
          "Description": t.description || "",
          "Reference": t.reference || ""
        }));
      }
      break;

    case "withdrawals":
      const payouts = await prisma.payout.findMany({
        where: {
          vendorId: vendor.id,
          createdAt: { gte: startDate, lte: endDate }
        },
        orderBy: { createdAt: "desc" }
      });
      data = payouts.map(p => ({
        "Date": p.createdAt.toLocaleDateString(),
        "Amount": Number(p.amount),
        "Status": p.status,
        "Reference": p.reference || "N/A",
        "Processed At": p.processedAt ? p.processedAt.toLocaleDateString() : "N/A"
      }));
      break;

    case "taxes":
      const taxBookings = await prisma.booking.findMany({
        where: {
          vendorId: vendor.id,
          createdAt: { gte: startDate, lte: endDate },
          status: "EVENT_COMPLETED"
        },
        select: {
          bookingNumber: true,
          createdAt: true,
          totalAmount: true,
          taxAmount: true,
          commissionAmount: true,
          vendorPayout: true
        },
        orderBy: { createdAt: "desc" }
      });
      data = taxBookings.map(b => ({
        "Date": b.createdAt.toLocaleDateString(),
        "Booking #": b.bookingNumber,
        "Total Amount": Number(b.totalAmount),
        "GST/Tax": Number(b.taxAmount),
        "Platform Commission": Number(b.commissionAmount),
        "Taxable Payout": Number(b.vendorPayout)
      }));
      break;
  }

  return { data, businessName: vendor.businessName };
}

export async function generatePDFBuffer(title: string, data: any[], businessName: string) {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Mana Events - Report", 14, 22);
  doc.setFontSize(12);
  doc.text(`Vendor: ${businessName}`, 14, 30);
  doc.text(`Report: ${title}`, 14, 37);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 44);

  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(header => item[header]));

    autoTable(doc, {
      startY: 50,
      head: [headers],
      body: rows,
    });
  } else {
    doc.text("No data found for this period.", 14, 50);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export async function generateExcelBuffer(data: any[]) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}
