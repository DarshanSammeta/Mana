import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";

export async function GET(req: Request) {
  const payload = await getAuthPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: payload.userId },
      include: {
        cartitem: true
      }
    });

    if (!cart) return NextResponse.json({ items: [] });

    // Fetch details for each item
    const itemsWithDetails = await Promise.all(
      cart.cartitem.map(async (item) => {
        let details = null;
        if (item.type === "SERVICE") {
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

    // Return using 'items' key to stay consistent with frontend expectations if necessary,
    // or just return the mapped array.
    return NextResponse.json({ ...cart, items: itemsWithDetails });
  } catch (error: any) {
    console.error("Cart GET Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const payload = await getAuthPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { type, targetId, quantity = 1 } = await req.json();

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

    const item = await prisma.cartitem.upsert({
      where: {
        cartId_targetId_type: {
          cartId: cart.id,
          targetId,
          type
        }
      },
      update: {
        quantity: { increment: quantity },
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        cartId: cart.id,
        targetId,
        type,
        quantity,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error("Cart POST Error:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
    const payload = await getAuthPayload(req);
    if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
      const { searchParams } = new URL(req.url);
      const itemId = searchParams.get("itemId");

      if (!itemId) {
          // Clear cart
          const cart = await prisma.cart.findUnique({ where: { userId: payload.userId } });
          if (cart) {
              await prisma.cartitem.deleteMany({ where: { cartId: cart.id } });
          }
          return NextResponse.json({ message: "Cart cleared" });
      }

      await prisma.cartitem.delete({
        where: { id: itemId }
      });

      return NextResponse.json({ message: "Item removed from cart" });
    } catch (error: any) {
      console.error("Cart DELETE Error:", error);
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
