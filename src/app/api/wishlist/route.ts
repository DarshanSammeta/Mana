import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const payload = await getAuthPayload(req);
    if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { type, targetId } = await req.json();

    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: payload.userId }
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          id: crypto.randomUUID(),
          userId: payload.userId,
          updatedAt: new Date()
        }
      });
    }

    const existingItem = await prisma.wishlistitem.findUnique({
      where: {
        wishlistId_targetId_type: {
          wishlistId: wishlist.id,
          targetId,
          type
        }
      }
    });

    if (existingItem) {
      await prisma.wishlistitem.delete({ where: { id: existingItem.id } });
      return NextResponse.json({ message: "Removed from wishlist", action: "removed" });
    }

    const item = await prisma.wishlistitem.create({
      data: {
        id: crypto.randomUUID(),
        wishlistId: wishlist.id,
        type,
        targetId
      }
    });

    return NextResponse.json({ ...item, action: "added" }, { status: 201 });
  });
}

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const payload = await getAuthPayload(req);
    if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: payload.userId },
      select: {
        id: true,
        userId: true,
        wishlistitem: {
          select: {
            id: true,
            type: true,
            targetId: true,
            createdAt: true
          }
        }
      }
    });

    if (!wishlist) return NextResponse.json({ items: [] });

    const vendorIds = wishlist.wishlistitem.filter(i => i.type === "VENDOR").map(i => i.targetId);
    const serviceIds = wishlist.wishlistitem.filter(i => i.type === "SERVICE").map(i => i.targetId);
    const packageIds = wishlist.wishlistitem.filter(i => i.type === "PACKAGE").map(i => i.targetId);

    const [vendors, services, packages] = await Promise.all([
      vendorIds.length > 0 ? prisma.vendorprofile.findMany({
        where: { id: { in: vendorIds } },
        select: {
          id: true,
          businessName: true,
          logo: true,
          city: true,
          rating: true,
          reviewCount: true
        }
      }) : [],
      serviceIds.length > 0 ? prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: {
          id: true,
          title: true,
          basePrice: true,
          vendorprofile: {
            select: {
              id: true,
              businessName: true
            }
          }
        }
      }) : [],
      packageIds.length > 0 ? prisma.renamedpackage.findMany({
        where: { id: { in: packageIds } },
        select: {
          id: true,
          name: true,
          price: true,
          service: {
            select: {
              id: true,
              title: true,
              vendorprofile: {
                select: {
                  id: true,
                  businessName: true
                }
              }
            }
          }
        }
      }) : []
    ]);

    const itemsWithDetails = wishlist.wishlistitem.map(item => {
      let details = null;
      if (item.type === "VENDOR") {
        details = vendors.find(v => v.id === item.targetId);
      } else if (item.type === "SERVICE") {
        details = services.find(s => s.id === item.targetId);
      } else if (item.type === "PACKAGE") {
        details = packages.find(p => p.id === item.targetId);
      }
      return { ...item, details };
    });

    return NextResponse.json({ ...wishlist, items: itemsWithDetails });
  });
}
