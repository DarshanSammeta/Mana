import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { booking_status } from "@prisma/client";

export async function GET(req: Request) {
  const T0 = Date.now();
  const requestId = req.headers.get("x-request-id") || Math.random().toString(36).substring(7);
  console.log(`[DIAGNOSTIC] T0: Request Start, RequestId: ${requestId}`);

  const T1_start = Date.now();
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "CUSTOMER") return NextResponse.json({ status: 403 });
  const T1_end = Date.now();
  console.log(`[DIAGNOSTIC] T1: Auth/Session Check: ${T1_end - T1_start}ms, RequestId: ${requestId}`);

  const T2_start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = payload.userId;
    const T2_end = Date.now();
    console.log(`[DIAGNOSTIC] T2: Params Parsing: ${T2_end - T2_start}ms, RequestId: ${requestId}`);

    const T3 = Date.now();
    console.log(`[DIAGNOSTIC] T3: Before Prisma Call: ${T3 - T0}ms from start, RequestId: ${requestId}`);

    // Optimized: Direct relationship lookup instead of sequential profile resolution
    const whereClause: any = { customerprofile: { userId } };
    if (status && status !== 'ALL') {
      whereClause.status = status as booking_status;
    }

    const T4_parallel_start = Date.now();

    // Phase 1: Fetch base bookings
    const baseBookings = await prisma.booking.findMany({
      where: whereClause,
      take: 20, // Increased limit for better UX
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bookingNumber: true,
        eventDate: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        vendorId: true,
        city: true,
        state: true,
        eventTime: true
      }
    });

    if (baseBookings.length === 0) {
      return NextResponse.json([]);
    }

    const bookingIds = baseBookings.map(b => b.id);
    const vendorIds = [...new Set(baseBookings.map(b => b.vendorId).filter(Boolean))] as string[];

    // Phase 2: Parallel data fetching for relations
    const [vendors, bookingItems, payments] = await Promise.all([
      prisma.vendorprofile.findMany({
        where: { id: { in: vendorIds } },
        select: {
          id: true,
          businessName: true,
          logo: true,
          city: true,
          state: true
        }
      }),
      prisma.bookingitem.findMany({
        where: { bookingId: { in: bookingIds } },
        select: {
          bookingId: true,
          price: true,
          quantity: true,
          service: { select: { title: true } },
          Renamedpackage: { select: { name: true } }
        }
      }),
      prisma.payment.findMany({
        where: { bookingId: { in: bookingIds } },
        select: {
          bookingId: true,
          status: true,
          amount: true,
          createdAt: true
        }
      })
    ]);

    // Phase 3: Assembly (O(N) mapping)
    const vendorMap = new Map(vendors.map(v => [v.id, v]));
    const itemsMap = new Map();
    bookingItems.forEach(item => {
      const list = itemsMap.get(item.bookingId) || [];
      list.push(item);
      itemsMap.set(item.bookingId, list);
    });
    const paymentsMap = new Map();
    payments.forEach(p => {
      const list = paymentsMap.get(p.bookingId) || [];
      list.push(p);
      paymentsMap.set(p.bookingId, list);
    });

    const bookings = baseBookings.map(b => ({
      ...b,
      vendorprofile: b.vendorId ? vendorMap.get(b.vendorId) : null,
      bookingitem: itemsMap.get(b.id) || [],
      payment: paymentsMap.get(b.id) || []
    }));

    const T4_end = Date.now();
    console.log(`[DIAGNOSTIC] T4: Parallel Prisma Duration: ${T4_end - T4_parallel_start}ms, RequestId: ${requestId}`);

    const Tn_start = Date.now();
    const res = NextResponse.json(bookings);
    const Tn_end = Date.now();
    console.log(`[DIAGNOSTIC] Tn: Serialization: ${Tn_end - Tn_start}ms, RequestId: ${requestId}`);

    const Tend = Date.now();
    console.log(`[DIAGNOSTIC] Tend: Response Sent, Total: ${Tend - T0}ms, RequestId: ${requestId}`);
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error(`[API] [/customer/bookings] ERROR, RequestId: ${requestId}, Message: ${message}`);
    return NextResponse.json({ message }, { status: 500 });
  }
}
