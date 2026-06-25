import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { cartItems, wishlistItems } = await req.json();

    // 1. Merge Cart
    if (cartItems && cartItems.length > 0) {
      let cart = await prisma.cart.findUnique({
        where: { userId: payload.userId }
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            id: crypto.randomUUID(),
            userId: payload.userId,
            updatedAt: new Date()
          }
        });
      }

      for (const item of cartItems) {
        await prisma.cartitem.upsert({
          where: {
            cartId_targetId_type: {
              cartId: cart.id,
              targetId: item.targetId,
              type: item.type
            }
          },
          update: {
            quantity: { increment: item.quantity },
            updatedAt: new Date()
          },
          create: {
            id: crypto.randomUUID(),
            cartId: cart.id,
            targetId: item.targetId,
            type: item.type,
            quantity: item.quantity,
            updatedAt: new Date()
          }
        });
      }
    }

    // 2. Merge Wishlist
    if (wishlistItems && wishlistItems.length > 0) {
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

      for (const item of wishlistItems) {
        // Handle wishlistItems which might be an array of strings (IDs) or objects
        const targetId = typeof item === "string" ? item : item.targetId;
        const type = typeof item === "string" ? "SERVICE" : item.type; // Default to SERVICE if just ID

        await prisma.wishlistitem.upsert({
          where: {
            wishlistId_targetId_type: {
              wishlistId: wishlist.id,
              targetId: targetId,
              type: type
            }
          },
          update: {}, // Do nothing if already exists
          create: {
            id: crypto.randomUUID(),
            wishlistId: wishlist.id,
            targetId: targetId,
            type: type
          }
        });
      }
    }

    return NextResponse.json({ message: "Merge successful" });
  } catch (error: any) {
    console.error("Merge error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
