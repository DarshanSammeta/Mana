import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDay } from "date-fns";

export async function POST(req: Request) {
  try {
    const { vendorId, date } = await req.json();

    if (!vendorId || !date) {
      return NextResponse.json({ message: "Vendor ID and date are required" }, { status: 400 });
    }

    const checkDate = new Date(date);
    const dayOfWeek = getDay(checkDate); // 0 (Sunday) to 6 (Saturday)

    // 1. Fetch Vendor Profile & Base Settings
    const vendor = await prisma.vendorprofile.findUnique({
      where: { id: vendorId },
      include: {
        availability: {
          where: {
            date: {
              gte: new Date(checkDate.setHours(0, 0, 0, 0)),
              lt: new Date(checkDate.setHours(23, 59, 59, 999))
            }
          }
        },
        recurringavailability: {
          where: { dayOfWeek: dayOfWeek }
        }
      }
    });

    if (!vendor) {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    // 2. Check Vacation Mode
    if (vendor.vacationMode) {
      const isWithinVacation = (
        vendor.vacationStartDate &&
        vendor.vacationEndDate &&
        checkDate >= vendor.vacationStartDate &&
        checkDate <= vendor.vacationEndDate
      );
      if (isWithinVacation) {
        return NextResponse.json({
          available: false,
          reason: "Vendor is currently on vacation during these dates."
        });
      }
    }

    // 3. Check Specific Date Override (Manual blocks)
    const specificDate = vendor.availability[0];
    if (specificDate && !specificDate.isAvailable) {
      return NextResponse.json({
        available: false,
        reason: specificDate.notes || "Vendor has manually blocked this date."
      });
    }

    // 4. Check Recurring Availability
    const recurring = vendor.recurringavailability[0];
    if (recurring && !recurring.isAvailable) {
        return NextResponse.json({
            available: false,
            reason: "Vendor does not provide services on this day of the week."
        });
    }

    // 5. Check Booking Limits (Enterprise Calendar Engine)
    // Count confirmed bookings for this date
    const bookings = await prisma.booking.findMany({
      where: {
        vendorId: vendorId,
        eventDate: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999))
        },
        status: { in: ["CONFIRMED", "PAYMENT_PENDING", "QUOTE_ACCEPTED", "PREPARATION", "VENDOR_ASSIGNED", "VENDOR_TRAVELING", "VENDOR_ARRIVED", "OTP_VERIFICATION_PENDING", "EVENT_STARTED", "EVENT_ONGOING"] }
      },
      select: { eventTime: true }
    });

    const bookingCount = bookings.length;
    const limit = specificDate?.bookingLimit ?? recurring?.bookingLimit ?? 1;

    if (bookingCount >= limit) {
      return NextResponse.json({
        available: false,
        reason: "Vendor has reached their maximum booking limit for this date."
      });
    }

    // 6. Check Lead Time (Advance Notice)
    const minNoticeHours = vendor.minBookingNotice || 24;
    const noticeDeadline = new Date();
    noticeDeadline.setHours(noticeDeadline.getHours() + minNoticeHours);

    if (checkDate < noticeDeadline) {
        return NextResponse.json({
            available: false,
            reason: `Vendor requires at least ${minNoticeHours} hours advance notice for bookings.`
        });
    }

    // 7. Check Advance Booking Window (Future limit)
    const maxAdvanceDays = vendor.advanceBookingDays || 365;
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + maxAdvanceDays);

    if (checkDate > maxFutureDate) {
        return NextResponse.json({
            available: false,
            reason: `Vendor is only accepting bookings up to ${maxAdvanceDays} days in advance.`
        });
    }

    // 8. Buffer Time Check (Simplified for production)
    // If a time is provided, check if it conflicts with existing bookings considering buffer time
    const { eventTime } = await (async () => {
        try {
            const body = await req.clone().json();
            return { eventTime: body.eventTime };
        } catch {
            return { eventTime: null };
        }
    })();

    if (eventTime && vendor.bufferTime > 0) {
        const [h, m] = eventTime.split(':').map(Number);
        const requestedTimeInMinutes = h * 60 + m;
        const bufferMinutes = vendor.bufferTime;

        for (const b of bookings) {
            if (b.eventTime) {
                const [bh, bm] = b.eventTime.split(':').map(Number);
                const bookingTimeInMinutes = bh * 60 + bm;

                if (Math.abs(requestedTimeInMinutes - bookingTimeInMinutes) < bufferMinutes) {
                    return NextResponse.json({
                        available: false,
                        reason: `Time conflict. Vendor requires ${bufferMinutes} minutes buffer between events.`
                    });
                }
            }
        }
    }

    return NextResponse.json({ available: true, limit, currentBookings: bookingCount });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
