import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { sendSMS } from "@/lib/sms/twilio";
import { sendBookingConfirmationEmail, sendVendorNotificationEmail } from "@/lib/mail/resend";
import { format } from "date-fns";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

const bookingSchema = z.object({
  vendorId: z.string().optional(),
  items: z.array(z.object({
    serviceId: z.string(),
    packageId: z.string().optional(),
    price: z.number().positive(),
    quantity: z.number().int().positive().default(1),
  })).min(1),
  eventDate: z.string().datetime(),
  eventTime: z.string().optional(),
  eventLocation: z.string().min(5),
  landmark: z.string().optional(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  guestCount: z.number().int().positive(),
  totalAmount: z.number().positive(),
  subTotal: z.number().positive(),
  taxAmount: z.number().nonnegative(),
  specialInstructions: z.string().optional(),
  eventName: z.string().min(2),
  eventType: z.string(),
  eventDescription: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!rateLimit(ip, 10, 60000)) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "CUSTOMER") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = bookingSchema.parse(body);
    const {
      vendorId,
      items,
      eventDate,
      eventTime,
      eventLocation,
      guestCount,
      totalAmount,
      subTotal,
      taxAmount,
      specialInstructions,
      eventName,
      eventType,
      eventDescription,
      landmark,
      city,
      state,
      pincode
    } = validated;

    // Server-side amount validation
    let calculatedSubTotal = 0;
    for (const item of items) {
        // In a real production app, we would fetch prices from DB here to prevent tampering
        calculatedSubTotal += item.price * item.quantity;
    }
    // Simple check for demo, in production we'd re-calculate everything including tax
    if (Math.abs(calculatedSubTotal - subTotal) > 0.01) {
         return NextResponse.json({ message: "Price mismatch detected" }, { status: 400 });
    }

    // Generate Amazon-style Booking ID: ME-YYYY-XXXXXX
    const currentYear = new Date().getFullYear();
    const count = await prisma.booking.count({
        where: { createdAt: { gte: new Date(`${currentYear}-01-01`) } }
    });
    const bookingNumber = `ME-${currentYear}-${(count + 1).toString().padStart(6, '0')}`;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Helper for distance calculation
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 0.5 - Math.cos(dLat) / 2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                (1 - Math.cos(dLon)) / 2;
      return R * 2 * Math.asin(Math.sqrt(a));
    };

    const commissionRate = 10.0; // Default 10%
    const commissionAmount = (totalAmount * commissionRate) / 100;
    const vendorPayout = totalAmount - commissionAmount;

    const booking = await prisma.$transaction(async (tx) => {
      // 1. Create the base booking
      const newBooking = await tx.booking.create({
        data: {
          id: crypto.randomUUID(),
          bookingNumber,
          customerId: payload.userId,
          vendorId: vendorId || "SYSTEM_ALLOCATED",
          eventDate: new Date(eventDate),
          eventTime,
          eventLocation,
          landmark,
          city,
          state,
          pincode,
          eventName,
          eventType,
          eventDescription,
          guestCount,
          totalAmount,
          subTotal,
          taxAmount,
          commissionRate,
          commissionAmount,
          vendorPayout,
          specialInstructions,
          otp,
          status: "PENDING",
          updatedAt: new Date(),
          bookingitem: {
            create: items.map((item: any) => ({
              id: crypto.randomUUID(),
              serviceId: item.serviceId,
              packageId: item.packageId || null,
              price: item.price,
              quantity: item.quantity || 1,
            })),
          },
          bookingstatuslog: {
            create: {
              id: crypto.randomUUID(),
              status: "PENDING",
              notes: "Booking initiated by customer",
            }
          }
        },
        include: {
          user: { select: { fullName: true, mobileNumber: true, email: true } }
        }
      });

      // 2. Automated Allocation Logic
      if (vendorId) {
        // Direct Assignment
        await tx.bookingassignment.create({
          data: {
            id: crypto.randomUUID(),
            bookingId: newBooking.id,
            vendorId: vendorId,
            priority: 1,
            status: "PENDING",
            updatedAt: new Date(),
          }
        });
      } else {
        // ... (Smart Match logic)
        const firstItem = await tx.bookingitem.findFirst({
            where: { bookingId: newBooking.id },
            include: { service: true }
        });
        const serviceTypeId = firstItem?.service.serviceTypeId;
        const customerLat = body.latitude;
        const customerLng = body.longitude;

        if (customerLat && customerLng && serviceTypeId) {
          const candidateVendors = await tx.vendorprofile.findMany({
            where: {
              verificationStatus: "APPROVED",
              service: { some: { serviceTypeId } }
            },
            select: {
                id: true,
                latitude: true,
                longitude: true,
                serviceRadius: true
            }
          });

          const nearbyVendors = candidateVendors
            .map(v => ({
              id: v.id,
              distance: v.latitude && v.longitude ? getDistance(customerLat, customerLng, v.latitude, v.longitude) : Infinity,
              radius: v.serviceRadius || 50
            }))
            .filter(v => v.distance <= v.radius)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3); // Top 3 closest

          for (let i = 0; i < nearbyVendors.length; i++) {
            await tx.bookingassignment.create({
              data: {
                id: crypto.randomUUID(),
                bookingId: newBooking.id,
                vendorId: nearbyVendors[i].id,
                priority: i + 1,
                status: "PENDING",
                updatedAt: new Date(),
              }
            });
          }
        }
      }

      await createAuditLog({
        userId: payload.userId,
        action: "BOOKING_CREATED",
        details: { bookingId: newBooking.id, totalAmount },
        ipAddress: ip
      });

      return newBooking;
    });

    // Background notifications
    (async () => {
        try {
            const notifications = [];

            // Customer notifications
            notifications.push(sendSMS(
                booking.user.mobileNumber,
                `Hi ${booking.user.fullName}, your booking ${bookingNumber} is created. Track it at ${process.env.NEXT_PUBLIC_APP_URL}/customer/bookings`
            ));

            if (booking.user.email) {
                notifications.push(sendBookingConfirmationEmail(booking.user.email, {
                    customerName: booking.user.fullName,
                    bookingNumber: bookingNumber,
                    eventName: eventName,
                    eventDate: format(new Date(eventDate), "PPP"),
                    totalAmount: totalAmount.toString()
                }));
            }

            // Vendor notifications
            const assignments = await prisma.bookingassignment.findMany({
                where: { bookingId: booking.id },
                include: { vendorprofile: { include: { user: { select: { email: true, fullName: true, mobileNumber: true } } } } }
            });

            for (const assignment of assignments) {
                const v = assignment.vendorprofile;
                notifications.push(sendSMS(v.user.mobileNumber, `New booking request ${bookingNumber} available! Claim it now in your Seller Dashboard.`));
                if (v.user.email) {
                    notifications.push(sendVendorNotificationEmail(v.user.email, {
                        vendorName: v.user.fullName,
                        bookingNumber: bookingNumber,
                        eventName: eventName,
                        eventDate: format(new Date(eventDate), "PPP"),
                        customerName: booking.user.fullName,
                        payoutAmount: vendorPayout.toString()
                    }));
                }
            }

            await Promise.allSettled(notifications);
        } catch (err) {
            console.error("Background notification error:", err);
        }
    })();

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Booking Creation Error:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("id");

    if (bookingId) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                vendorprofile: true,
                user: {
                    select: { fullName: true, email: true, mobileNumber: true },
                },
                bookingitem: {
                    include: {
                        service: true,
                        Renamedpackage: true,
                    },
                },
                payment: true
            },
        });
        return NextResponse.json(booking);
    }

    const bookings = await prisma.booking.findMany({
      where: payload.role === "CUSTOMER" ? { customerId: payload.userId } : { vendorprofile: { userId: payload.userId } },
      include: {
        vendorprofile: true,
        user: {
          select: { fullName: true, email: true, mobileNumber: true },
        },
        bookingitem: {
          include: {
            service: true,
            Renamedpackage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
