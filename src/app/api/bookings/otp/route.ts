import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { sendOTP } from "@/lib/sms/twilio";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { bookingId } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.customerId !== payload.userId) {
        return NextResponse.json({ message: "Only customer can generate OTP" }, { status: 403 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const checkin = await prisma.eventcheckin.upsert({
      where: { bookingId },
      update: { otp, generatedAt: new Date(), verifiedAt: null, status: "PENDING" },
      create: { id: crypto.randomUUID(), bookingId, otp, status: "PENDING" }
    });

    // Send OTP via SMS
    try {
      await sendOTP(booking.user.mobileNumber, otp);
    } catch (smsError) {
      console.error("Failed to send OTP SMS:", smsError);
    }

    return NextResponse.json({ message: "OTP generated and sent successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { bookingId, otp } = await req.json();

    const checkin = await prisma.eventcheckin.findUnique({
      where: { bookingId },
      include: { booking: { include: { vendorprofile: true } } }
    });

    if (!checkin) return NextResponse.json({ message: "Check-in record not found" }, { status: 404 });
    if (checkin.booking.vendorprofile.userId !== payload.userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (checkin.otp !== otp) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    await prisma.eventcheckin.update({
      where: { bookingId },
      data: { verifiedAt: new Date(), status: "SUCCESS" }
    });

    // Update booking status
    await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: "EVENT_STARTED",
            bookingstatuslog: {
                create: {
                  id: crypto.randomUUID(),
                  status: "EVENT_STARTED",
                  notes: "OTP Verified. Event started."
                }
            }
        }
    });

    return NextResponse.json({ message: "OTP verified. Event started!" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
