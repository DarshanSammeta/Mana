import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyAccessToken } from "@/lib/auth";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { withErrorHandler } from "@/lib/error-handler";
import { inngest } from "@/lib/inngest";
import logger from "@/lib/logger";

const bookingSchema = z.object({
  vendorId: z.string().optional(),
  items: z.array(z.object({
    serviceId: z.string(),
    packageId: z.string().optional(),
    price: z.number().positive(),
    quantity: z.number().int().positive().default(1),
  })).min(1),
  eventDate: z.string(),
  eventTime: z.string().optional(),
  eventLocation: z.string().min(5, "Address must be at least 5 characters long"),
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
  longitude: z.number().optional(),
  idempotencyKey: z.string().optional()
});

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitResult = await rateLimit(ip, { limit: 10, window: 60 });
    if (!rateLimitResult.success) {
      logger.warn("Rate limit exceeded for booking creation", { ip });
      return NextResponse.json({ message: "Too many requests" }, { status: 429 });
    }

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      logger.warn("Unauthorized booking attempt", { ip });
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "CUSTOMER") {
      logger.warn("Forbidden booking attempt", { userId: payload?.userId, role: payload?.role, ip });
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Idempotency check before starting transaction
    if (body.idempotencyKey) {
      const existingBooking = await prisma.booking.findUnique({
        where: { idempotencyKey: body.idempotencyKey }
      });
      if (existingBooking) {
        logger.info("Idempotent booking request received", { idempotencyKey: body.idempotencyKey, bookingId: existingBooking.id });
        return NextResponse.json(existingBooking, { status: 200 });
      }
    }

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
      pincode,
      idempotencyKey
    } = validated;

    // Server-side amount validation & inventory check would go here in enterprise apps
    // 1. Fetch current prices and hierarchy from DB
    const serviceIds = items.map(i => i.serviceId);
    const packageIds = items.filter(i => i.packageId).map(i => i.packageId as string);

    const dbServices = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: {
        id: true,
        title: true,
        basePrice: true,
        servicetype: {
          select: {
            id: true,
            name: true,
            subcategory: {
              select: {
                id: true,
                name: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    eventtypes: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const dbPackages = await prisma.renamedpackage.findMany({
      where: { id: { in: packageIds } },
      select: {
        id: true,
        serviceId: true,
        price: true
      }
    });

    let calculatedSubTotal = 0;
    for (const item of items) {
        const service = dbServices.find(s => s.id === item.serviceId);
        if (!service) throw new Error(`Service ${item.serviceId} not found`);

        // Hierarchy Integrity Check: Ensure service belongs to the eventType in the booking
        const hasEventType = service.servicetype.subcategory.category.eventtypes.some(et => et.id === eventType);
        if (!hasEventType) {
             return NextResponse.json({
               message: `Service hierarchy mismatch: ${service.title} does not belong to Event Type ${eventType}`
             }, { status: 400 });
        }

        if (item.packageId) {
          const pkg = dbPackages.find(p => p.id === item.packageId);
          if (!pkg) throw new Error(`Package ${item.packageId} not found`);
          if (pkg.serviceId !== item.serviceId) {
            return NextResponse.json({ message: "Package does not belong to the selected service" }, { status: 400 });
          }
          calculatedSubTotal += Number(pkg.price) * item.quantity;
        } else {
          calculatedSubTotal += Number(service.basePrice) * item.quantity;
        }
    }

    if (Math.abs(calculatedSubTotal - subTotal) > 0.01) {
         logger.error("Price mismatch in booking creation", { calculatedSubTotal, subTotal, userId: payload.userId });
         return NextResponse.json({ message: `Price mismatch detected. Expected: ${calculatedSubTotal}, Received: ${subTotal}` }, { status: 400 });
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
      // 2. Automated Allocation Logic
      const finalVendorId = vendorId || "SYSTEM_ALLOCATED";

      // 1. Create the base booking
      const newBooking = await tx.booking.create({
        data: {
          id: crypto.randomUUID(),
          bookingNumber,
          customerId: payload.userId,
          vendorId: finalVendorId,
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
          idempotencyKey,
          status: "PENDING",
          updatedAt: new Date(),
          bookingitem: {
            create: items.map((item) => ({
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
        select: {
          id: true,
          bookingNumber: true,
          customerId: true,
          vendorId: true,
          eventDate: true,
          eventTime: true,
          eventLocation: true,
          landmark: true,
          city: true,
          state: true,
          pincode: true,
          eventName: true,
          eventType: true,
          eventDescription: true,
          guestCount: true,
          totalAmount: true,
          subTotal: true,
          taxAmount: true,
          status: true,
          specialInstructions: true,
          otp: true,
          idempotencyKey: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { fullName: true, mobileNumber: true, email: true } }
        }
      });

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
            select: {
              service: {
                select: {
                  serviceTypeId: true
                }
              }
            }
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
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Prevent race conditions on bookingNumber or availability
    });

    // Trigger enterprise background jobs via Inngest
    await inngest.send({
      name: "booking/created",
      data: {
        bookingId: booking.id,
      },
    });

    logger.info("Booking created successfully", { bookingId: booking.id, userId: payload.userId, bookingNumber });

    return NextResponse.json(booking, { status: 201 });
  });
}

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("id");

    if (bookingId) {
        logger.info("Fetching booking details", { bookingId, userId: payload.userId });
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                bookingNumber: true,
                customerId: true,
                vendorId: true,
                eventDate: true,
                eventTime: true,
                eventLocation: true,
                landmark: true,
                city: true,
                state: true,
                pincode: true,
                eventName: true,
                eventType: true,
                eventDescription: true,
                guestCount: true,
                totalAmount: true,
                subTotal: true,
                taxAmount: true,
                status: true,
                specialInstructions: true,
                otp: true,
                createdAt: true,
                vendorprofile: {
                    select: {
                        id: true,
                        businessName: true,
                        logo: true,
                        city: true,
                        state: true
                    }
                },
                user: {
                    select: { fullName: true, email: true, mobileNumber: true },
                },
                bookingitem: {
                    select: {
                        id: true,
                        price: true,
                        quantity: true,
                        service: {
                            select: {
                                id: true,
                                title: true
                            }
                        },
                        Renamedpackage: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                    },
                },
                payment: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        razorpayPaymentId: true
                    }
                }
            },
        });

        if (!booking) {
          return NextResponse.json({ message: "Booking not found" }, { status: 404 });
        }

        // Authorization check: only customer or vendor involved can see it
        if (payload.role === "CUSTOMER" && booking.customerId !== payload.userId) {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // For vendors, check if they are the assigned vendor
        if (payload.role === "VENDOR") {
          const vendorProfile = await prisma.vendorprofile.findUnique({
            where: { userId: payload.userId }
          });
          if (booking.vendorId !== vendorProfile?.id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
          }
        }

        return NextResponse.json(booking);
    }

    logger.info("Fetching user bookings", { userId: payload.userId, role: payload.role });

    const bookings = await prisma.booking.findMany({
      where: payload.role === "CUSTOMER" ? { customerId: payload.userId } : { vendorprofile: { userId: payload.userId } },
      select: {
        id: true,
        bookingNumber: true,
        eventDate: true,
        status: true,
        totalAmount: true,
        eventName: true,
        vendorprofile: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            city: true
          }
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobileNumber: true
          },
        },
        bookingitem: {
          select: {
            id: true,
            price: true,
            quantity: true,
            service: {
              select: {
                id: true,
                title: true
              }
            },
            Renamedpackage: {
              select: {
                id: true,
                name: true
              }
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  });
}
