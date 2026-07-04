import { APP_CONFIG } from "@/config/app";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms/twilio";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  // Security: In production, verify this is called by a CRON provider (e.g., Vercel, Upstash)
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${APP_CONFIG.cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();

    // 1. Five-Day Reminder (Vendor Confirmation Required - Step 9)
    const fiveDaysFromNow = addDays(today, 5);
    const bookings5d = await prisma.booking.findMany({
      where: {
        eventDate: {
          gte: startOfDay(fiveDaysFromNow),
          lte: endOfDay(fiveDaysFromNow),
        },
        status: "CONFIRMED",
        vendorConfirmedAt5d: null // Only if not already confirmed
      },
      include: {
        user: true,
        vendorprofile: { include: { user: true } },
      },
    });

    for (const b of bookings5d) {
      // Notify Vendor (Action Required)
      await sendSMS(
        b.vendorprofile!.user.mobileNumber,
        `URGENT: Booking #${b.bookingNumber} is in 5 days. Confirm your availability in the app now or it will be reassigned.`
      );

      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: b.vendorprofile!.userId,
          title: "Action Required: Confirm Availability",
          message: `Please confirm you are ready for ${b.bookingNumber} on ${b.eventDate.toDateString()}.`,
          category: "BOOKING",
          priority: "HIGH",
          link: `/vendor/bookings/${b.id}`
        }
      });
      // Notify Customer
      await sendSMS(
        b.user.mobileNumber,
        `Hi ${b.user.fullName}, your event "${b.eventName}" is in 5 days! Your vendor ${b.vendorprofile?.businessName} has been notified.`
      );
    }

    // 2. Three-Day Reminder (Checklist Reminder)
    const threeDaysFromNow = addDays(today, 3);
    const bookings3d = await prisma.booking.findMany({
      where: {
        eventDate: {
          gte: startOfDay(threeDaysFromNow),
          lte: endOfDay(threeDaysFromNow),
        },
        status: "CONFIRMED",
      },
      include: {
        vendorprofile: { include: { user: true } },
      },
    });

    for (const b of bookings3d) {
      await sendSMS(
        b.vendorprofile!.user.mobileNumber,
        `CHECKLIST: Your booking #${b.bookingNumber} is in 3 days. Please complete your checklist (Staff, Materials, Vehicle) now.`
      );
    }

    // 3. One-Day Reminder (Final Confirmation)
    const oneDayFromNow = addDays(today, 1);
    const bookings1d = await prisma.booking.findMany({
      where: {
        eventDate: {
          gte: startOfDay(oneDayFromNow),
          lte: endOfDay(oneDayFromNow),
        },
        status: "CONFIRMED",
      },
      include: {
        vendorprofile: { include: { user: true } },
      },
    });

    for (const b of bookings1d) {
      await sendSMS(
        b.vendorprofile!.user.mobileNumber,
        `FINAL REMINDER: Booking #${b.bookingNumber} is tomorrow! Check location and contact the customer if needed.`
      );
    }

    return NextResponse.json({
      processed: {
        fiveDay: bookings5d.length,
        threeDay: bookings3d.length,
        oneDay: bookings1d.length
      }
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
