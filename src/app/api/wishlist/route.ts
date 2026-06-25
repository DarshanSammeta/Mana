import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";

export async function POST(req: Request) {
  const payload = await getAuthPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
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
  } catch (error: any) {
    console.error("Wishlist POST Error:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const payload = await getAuthPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: payload.userId },
      include: {
        wishlistitem: true
      }
    });

    if (!wishlist) return NextResponse.json({ items: [] });

    const itemsWithDetails = await Promise.all(
      wishlist.wishlistitem.map(async (item) => {
        let details = null;
        if (item.type === "VENDOR") {
          details = await prisma.vendorprofile.findUnique({
            where: { id: item.targetId }
          });
        } else if (item.type === "SERVICE") {
          details = await prisma.service.findUnique({
            where: { id: item.targetId },
            include: { vendorprofile: true }
          });
        } else if (item.type === "PACKAGE") {
          details = await prisma.renamedpackage.findUnique({
            where: { id: item.targetId },
            include: { service: { include: { vendorprofile: true } } }
          });
        }
        return { ...item, details };
      })
    );

    return NextResponse.json({ ...wishlist, items: itemsWithDetails });
  } catch (error: any) {
    console.error("Wishlist GET Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
