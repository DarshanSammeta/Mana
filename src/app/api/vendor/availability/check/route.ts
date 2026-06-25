import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { vendorId, date, startTime, endTime } = await req.json();

    if (!vendorId || !date) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // 1. Check for specific date override
    const override = await prisma.availability.findFirst({
      where: {
        vendorProfileId: vendorId,
        date: {
          gte: new Date(new Date(targetDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(targetDate).setHours(23, 59, 59, 999)),
        },
      },
    });

    if (override) {
      if (!override.isAvailable) {
        return NextResponse.json({ available: false, reason: "Vendor is unavailable on this date" });
      }
      if (startTime && endTime && override.startTime && override.endTime) {
         if (startTime < override.startTime || endTime > override.endTime) {
            return NextResponse.json({ available: false, reason: "Time is outside vendor's available hours" });
         }
      }
    } else {
      // 2. Check for recurring availability
      const recurring = await prisma.recurringavailability.findUnique({
        where: {
          vendorProfileId_dayOfWeek: {
            vendorProfileId: vendorId,
            dayOfWeek,
          },
        },
      });

      if (recurring) {
        if (!recurring.isAvailable) {
          return NextResponse.json({ available: false, reason: "Vendor is not available on this day of the week" });
        }
        if (startTime && endTime && recurring.startTime && recurring.endTime) {
            if (startTime < recurring.startTime || endTime > recurring.endTime) {
               return NextResponse.json({ available: false, reason: "Time is outside vendor's available hours" });
            }
         }
      }
    }

    // 3. Check for existing confirmed bookings
    const existingBookings = await prisma.booking.findMany({
      where: {
        vendorId: vendorId,
        eventDate: {
            gte: new Date(new Date(targetDate).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(targetDate).setHours(23, 59, 59, 999)),
        },
        status: {
          in: ["CONFIRMED", "ACCEPTED", "VENDOR_ASSIGNED"]
        }
      }
    });

    if (existingBookings.length > 0) {
        if (startTime && endTime) {
             const conflict = existingBookings.some(b => {
                if (!b.eventTime) return true;
                return b.eventTime === startTime;
             });
             if (conflict) {
                return NextResponse.json({ available: false, reason: "Vendor has a conflicting booking" });
             }
        } else {
             return NextResponse.json({ available: false, reason: "Vendor is booked on this date", bookings: existingBookings.length });
        }
    }

    return NextResponse.json({ available: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
