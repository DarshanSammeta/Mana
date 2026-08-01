import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { pricingService } from "@/services/server/pricing.service";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AuditService } from "@/services/server/audit.service";

import { bookingSchema } from "@/validations/booking";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    console.log("[DEBUG] [POST /api/bookings] Request received");
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // 1. Parse and Validate Body FIRST (Sync, 0 RTT)
    const body = await req.json();
    const validated = bookingSchema.parse(body);

    // Phase 1: Rate Limiting (10 requests per minute)
    const rateLimitResult = await rateLimit(`booking-create-${ip}`, { limit: 10, window: 60 });
    if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult, "Too many booking attempts. Please wait a minute.");
    }

    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      console.log("[DEBUG] [POST /api/bookings] No token found in authorization header");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
        payload = await verifyAccessToken(token);
        console.log("[DEBUG] [POST /api/bookings] Token verified", { userId: payload?.userId, role: payload?.role });
    } catch (err) {
        console.error("[DEBUG] [POST /api/bookings] Token verification failed", err);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!payload) {
        console.log("[DEBUG] [POST /api/bookings] Forbidden: Role mismatch or invalid payload");
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 2. Parallelize all independent DB lookups (1 RTT total)
    console.log("[DEBUG] [POST /api/bookings] Starting parallel lookups...");
    const tParallelStart = performance.now();

    const [profile, validation, currentYearCount] = await Promise.all([
        // Lookup 1: Customer Profile
        prisma.customerprofile.findUnique({
            where: { userId: payload.userId }
        }),
        // Lookup 2: Hierarchy & Package Data
        pricingService.validateHierarchy({
            eventTypeId: validated.eventTypeId,
            categoryId: validated.categoryId,
            subcategoryId: validated.subcategoryId,
            serviceTypeId: validated.serviceTypeId,
            packageId: validated.packageId
        }),
        // Lookup 3: Sequential booking count for ID generation
        prisma.booking.count({
            where: { createdAt: { gte: new Date(`${new Date().getFullYear()}-01-01`) } }
        })
    ]);

    console.log(`[PERF] Parallel lookups took ${(performance.now() - tParallelStart).toFixed(2)}ms`);

    if (!profile) {
        return NextResponse.json({ message: "Customer profile not found" }, { status: 404 });
    }

    if (!validation.valid || !validation.pkg) {
        console.log("[DEBUG] [POST /api/bookings] Hierarchy validation FAILED:", validation.message);
        return NextResponse.json({ message: validation.message }, { status: 400 });
    }
    console.log("[DEBUG] [POST /api/bookings] Hierarchy validation PASSED");

    const pkg = validation.pkg;

    // 3. Final Server-Side Pricing Calculation (Using pre-fetched package, 0 RTT)
    const pricing = await pricingService.calculateBookingPrice({
        packageId: validated.packageId,
        guestCount: validated.guestCount,
        addonIds: validated.selectedAddonIds
    }, undefined, pkg);

    // 3. Generate Snapshot
    console.log("[DEBUG] [POST /api/bookings] Generating snapshot...");

    // Safety check for snapshot fields
    if (!pkg.service) console.error("[DEBUG] snapshot: pkg.service is NULL");
    else if (!pkg.service.vendorprofile) console.error("[DEBUG] snapshot: pkg.service.vendorprofile is NULL");

    const snapshot = {
        version: 1,
        timestamp: new Date().toISOString(),
        vendor: {
            id: validated.vendorId,
            name: pkg.service?.vendorprofile?.businessName || "Unknown Vendor",
        },
        hierarchy: {
            eventType: pkg.service?.servicetype?.subcategory?.category?.eventtype?.name || "Unknown",
            category: pkg.service?.servicetype?.subcategory?.category?.name || "Unknown",
            subCategory: pkg.service?.servicetype?.subcategory?.name || "Unknown",
            serviceType: pkg.service?.servicetype?.name || "Unknown",
        },
        package: {
            id: pkg.id,
            name: pkg.name,
            basePrice: pricing.basePrice
        },
        addons: pricing.addonsDetail,
        pricing: pricing.breakdown,
        milestones: {
            advance: pricing.advanceAmount,
            balance: pricing.balanceAmount
        }
    };
    console.log("[DEBUG] [POST /api/bookings] Snapshot generated");

    // 4. Create Booking
    const currentYear = new Date().getFullYear();
    const bookingNumber = `BK-${currentYear}-${(currentYearCount + 1).toString().padStart(6, '0')}`;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("[DEBUG] [POST /api/bookings] Generated bookingNumber:", bookingNumber);

    console.log("[DEBUG] [POST /api/bookings] Starting Prisma transaction...");
    try {
        const tTxStart = performance.now();
        const booking = await prisma.$transaction(async (tx) => {
            const createPayload = {
                bookingNumber,
                customerProfileId: profile.id,
                vendorId: validated.vendorId,
                eventTypeId: validated.eventTypeId,
                categoryId: validated.categoryId,
                subcategoryId: validated.subcategoryId,
                serviceTypeId: validated.serviceTypeId,
                packageId: validated.packageId,
                eventDate: new Date(validated.eventDate),
                eventTime: validated.eventTime,
                eventLocation: validated.eventLocation,
                landmark: validated.landmark,
                city: validated.city,
                state: validated.state,
                pincode: validated.pincode,
                guestCount: validated.guestCount,
                eventName: validated.eventName,
                eventDescription: validated.eventDescription,
                specialInstructions: validated.specialInstructions,
                subTotal: pricing.subtotal,
                taxAmount: pricing.taxes,
                totalAmount: pricing.total,
                advanceAmount: pricing.advanceAmount,
                balanceAmount: pricing.balanceAmount,
                paymentStage: "PENDING",
                snapshot,
                otp,
                idempotencyKey: validated.idempotencyKey,
                status: "PENDING_VENDOR_RESPONSE" as any,
                bookingitem: {
                    create: {
                        serviceId: pkg.service.id,
                        packageId: pkg.id,
                        price: pricing.basePrice,
                        quantity: 1
                    }
                },
                booking_addon: {
                    create: pricing.addonsDetail.map((a: any) => ({
                        addonId: a.id,
                        name: a.name,
                        price: a.price
                    }))
                },
                bookingstatuslog: {
                    create: {
                        status: "PENDING_VENDOR_RESPONSE" as any,
                        notes: "Booking initiated. Waiting for vendor response."
                    }
                },
                booking_timeline: {
                    create: {
                        title: "Request Submitted",
                        description: `Booking request sent to ${pkg.service.vendorprofile.businessName}.`,
                        performedBy: (payload as any).fullName || "Customer",
                        role: "CUSTOMER",
                        icon: "Send",
                        color: "blue"
                    }
                }
            };

            const newBooking = await tx.booking.create({
                data: createPayload
            });

            await tx.bookingassignment.create({
                data: {
                    bookingId: newBooking.id,
                    vendorId: validated.vendorId,
                    priority: 1,
                    status: "PENDING",
                    updatedAt: new Date()
                }
            });

            // ATOMIC AUDIT LOG
            await AuditService.logBooking(
                newBooking.id,
                "BOOKING_CREATED",
                { id: payload.userId, role: payload.role, name: (payload as any).fullName || "Customer" },
                { new: { total: pricing.total } },
                undefined,
                tx
            );

            return newBooking;
        });

        const tTxEnd = performance.now();
        const txTime = tTxEnd - tTxStart;
        console.log(`[PERF] Prisma transaction took ${txTime.toFixed(2)}ms`);
        if (txTime > 1000) console.warn(`[SLOW] Transaction exceeded 1s: ${txTime.toFixed(2)}ms`);

        // Graceful Inngest event - BACKGROUNDED
        import("@/lib/inngest").then(({ inngest }) => {
            console.log("[DEBUG] [Background] Sending Inngest event...");
            inngest.send({
                name: "booking/created",
                data: { bookingId: booking.id }
            }).then(() => console.log("[DEBUG] [Background] Inngest event sent"))
             .catch(err => console.error("[CRITICAL] [Background] Inngest event FAILED", err));
        }).catch(err => console.error("[CRITICAL] [Background] Inngest import failed", err));

        console.log("[DEBUG] [POST /api/bookings] Returning success response");
        return NextResponse.json(booking, { status: 201 });

    } catch (txErr: any) {
        console.error("[DEBUG] [POST /api/bookings] TRANSACTION FAILED", {
            code: txErr.code,
            message: txErr.message,
            meta: txErr.meta,
            stack: txErr.stack
        });

        if (txErr.code === "P2002") {
            console.error("[DEBUG] UNIQUE CONSTRAINT VIOLATION DETECTED", txErr.meta?.target);
        }

        throw txErr; // will be handled by withErrorHandler
    }
  }, req);
}


export async function GET(_req: Request) {
  return NextResponse.json({ message: "Deprecated. Use role-scoped routes." }, { status: 410 });
}
