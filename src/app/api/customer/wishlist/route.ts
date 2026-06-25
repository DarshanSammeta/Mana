import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "CUSTOMER") return NextResponse.json({ status: 403 });

  try {
    const userId = payload.userId;

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        wishlistitem: true
      }
    });

    if (!wishlist) {
      return NextResponse.json([]);
    }

    const vendorIds = wishlist.wishlistitem
      .filter(item => item.type === 'VENDOR')
      .map(item => item.targetId);

    const serviceIds = wishlist.wishlistitem
      .filter(item => item.type === 'SERVICE')
      .map(item => item.targetId);

    const [vendors, services] = await Promise.all([
      prisma.vendorprofile.findMany({
        where: { id: { in: vendorIds } },
        select: {
          id: true,
          businessName: true,
          logo: true,
          rating: true,
          reviewCount: true,
          city: true,
          state: true,
          service: {
            take: 1,
            select: { basePrice: true, title: true }
          }
        }
      }),
      prisma.service.findMany({
        where: { id: { in: serviceIds } },
        include: {
          vendorprofile: {
            select: { businessName: true, logo: true }
          }
        }
      })
    ]);

    const itemsWithDetails = wishlist.wishlistitem.map(item => {
      if (item.type === 'VENDOR') {
        return { ...item, details: vendors.find(v => v.id === item.targetId) };
      } else if (item.type === 'SERVICE') {
        return { ...item, details: services.find(s => s.id === item.targetId) };
      }
      return item;
    });

    return NextResponse.json(itemsWithDetails);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ status: 403 });

    try {
      const { targetId, type } = await req.json();
      const userId = payload.userId;

      let wishlist = await prisma.wishlist.findUnique({
        where: { userId }
      });

      if (!wishlist) {
        wishlist = await prisma.wishlist.create({
          data: {
            userId,
            id: `wish_${userId.substring(0, 8)}`,
            updatedAt: new Date()
          }
        });
      }

      const existing = await prisma.wishlistitem.findUnique({
        where: {
          wishlistId_targetId_type: {
            wishlistId: wishlist.id,
            targetId,
            type
          }
        }
      });

      if (existing) {
        await prisma.wishlistitem.delete({
          where: { id: existing.id }
        });
        return NextResponse.json({ action: 'removed' });
      } else {
        await prisma.wishlistitem.create({
          data: {
            id: `wi_${Math.random().toString(36).substring(2, 9)}`,
            wishlistId: wishlist.id,
            targetId,
            type
          }
        });
        return NextResponse.json({ action: 'added' });
      }
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
