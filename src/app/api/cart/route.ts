import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const cart = await prisma.cart.findUnique({
      where: { userId: payload.userId },
      include: {
        cartitem: true
      }
    });

    if (!cart) return NextResponse.json({ items: [] });

    // Optimize: Bulk fetch details to avoid N+1
    const serviceIds = cart.cartitem.filter(i => i.type === "SERVICE").map(i => i.targetId);
    const packageIds = cart.cartitem.filter(i => i.type === "PACKAGE").map(i => i.targetId);

    const [services, packages] = await Promise.all([
      prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: {
          id: true,
          title: true,
          basePrice: true,
          vendorprofile: {
            select: {
              id: true,
              businessName: true,
              logo: true,
              city: true
            }
          }
        }
      }),
      prisma.renamedpackage.findMany({
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
                  businessName: true,
                  logo: true,
                  city: true
                }
              }
            }
          }
        }
      })
    ]);

    const itemsWithDetails = cart.cartitem.map((item) => {
      let details = null;
      if (item.type === "SERVICE") {
        details = services.find(s => s.id === item.targetId) || null;
      } else if (item.type === "PACKAGE") {
        details = packages.find(p => p.id === item.targetId) || null;
      }
      return { ...item, details };
    });

    return NextResponse.json({ ...cart, items: itemsWithDetails });
  });
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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

    logger.info("Item added/updated in cart", { userId: payload.userId, itemId: item.id });

    return NextResponse.json(item, { status: 201 });
  });
}

export async function DELETE(req: Request) {
  return withErrorHandler(async () => {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
        // Clear cart
        const cart = await prisma.cart.findUnique({ where: { userId: payload.userId } });
        if (cart) {
            await prisma.cartitem.deleteMany({ where: { cartId: cart.id } });
            logger.info("Cart cleared", { userId: payload.userId });
        }
        return NextResponse.json({ message: "Cart cleared" });
    }

    await prisma.cartitem.delete({
      where: { id: itemId }
    });

    logger.info("Item removed from cart", { userId: payload.userId, itemId });

    return NextResponse.json({ message: "Item removed from cart" });
  });
}
