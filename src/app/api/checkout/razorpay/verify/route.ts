import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) throw new Error("Booking not found");

      // Update Payment and Booking
      await prisma.$transaction([
        prisma.payment.create({
          data: {
            id: crypto.randomUUID(),
            bookingId,
            amount: booking.totalAmount,
            status: "SUCCESS",
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            method: "RAZORPAY",
            updatedAt: new Date(),
          },
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            bookingstatuslog: {
              create: { id: crypto.randomUUID(), status: "CONFIRMED", notes: "Payment successful via Razorpay" },
            },
          },
        }),
        // Notifications
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: payload.userId,
            title: "Booking Confirmed!",
            message: `Your booking ${booking.bookingNumber} has been confirmed.`,
            type: "BOOKING_UPDATE",
            link: `/customer/orders/${bookingId}`
          }
        }),
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: (await prisma.vendorprofile.findUnique({ where: { id: booking.vendorId }, select: { userId: true } }))?.userId || "",
            title: "New Booking Received",
            message: `You have a new confirmed booking ${booking.bookingNumber}.`,
            type: "BOOKING_UPDATE",
            link: `/vendor/bookings/${bookingId}`
          }
        })
      ]);

      // Generate Invoice record
      const invoiceNumber = `INV-${Date.now()}`;
      await prisma.invoice.create({
        data: {
          id: crypto.randomUUID(),
          bookingId,
          invoiceNumber,
        },
      });

      return NextResponse.json({ message: "Payment verified successfully" });
    } else {
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
