import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "SUPPORT_ADMIN", "CONTENT_ADMIN"];

async function checkAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  const payload = await verifyAccessToken(token);

  if (!payload || !ADMIN_ROLES.includes(payload.role)) {
    return null;
  }

  return payload;
}

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q || q.length < 2) {
      return NextResponse.json({ vendors: [], customers: [], bookings: [] });
    }

    const [vendors, customers, bookings] = await Promise.all([
      prisma.vendorprofile.findMany({
        where: {
          OR: [
            { businessName: { contains: q, mode: "insensitive" } },
            { user: { fullName: { contains: q, mode: "insensitive" } } },
          ]
        },
        take: 5,
        select: { id: true, businessName: true }
      }),
      prisma.customerprofile.findMany({
        where: {
          OR: [
            { user: { fullName: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ]
        },
        take: 5,
        select: { id: true, user: { select: { fullName: true } } }
      }),
      prisma.booking.findMany({
        where: {
          OR: [
            { bookingNumber: { contains: q, mode: "insensitive" } },
            { id: { contains: q, mode: "insensitive" } },
          ]
        },
        take: 5,
        select: { id: true, bookingNumber: true }
      })
    ]);

    return NextResponse.json({
      vendors: vendors.map(v => ({ id: v.id, name: v.businessName, type: "vendor" })),
      customers: customers.map(c => ({ id: c.id, name: c.user.fullName, type: "customer" })),
      bookings: bookings.map(b => ({ id: b.id, name: b.bookingNumber, type: "booking" }))
    });
  }, req);
}
