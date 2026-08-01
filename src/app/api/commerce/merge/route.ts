import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";
import { PricingEngine } from "@/services/server/pricing.engine";

export async function POST(req: Request) {
  const start = performance.now();
  const requestId = req.headers.get("x-request-id") || "unknown";

  const payload = await getServerSession(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const text = await req.text();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ message: "Empty request body" }, { status: 400 });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[Merge API] JSON parse error:", e);
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const { cartItems, wishlistItems } = data;

    const dbStart = performance.now();
    const profile = await prisma.customerprofile.findUnique({
        where: { userId: payload.userId },
        select: { id: true }
    });

    if (!profile) return NextResponse.json({ message: "Customer profile not found" }, { status: 404 });

    // 1. Merge Cart
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      let cart = await prisma.cart.findUnique({
        where: { customerProfileId: profile.id }
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            id: crypto.randomUUID(),
            customerProfileId: profile.id,
            updatedAt: new Date()
          }
        });
      }

      // Batch Pricing Calculation (Optimized via PricingEngine.calculateMultiItemPrice)
      const packageItems = cartItems.filter(i => i.type === "PACKAGE");
      const pricingMap = new Map<string, any>();

      if (packageItems.length > 0) {
        try {
          const pricingStart = performance.now();
          const pricingData = await PricingEngine.calculateMultiItemPrice(
            packageItems.map(item => ({
              packageId: item.targetId,
              guestCount: item.guestCount || 100,
              addonIds: item.addons || []
            }))
          );
          const pricingEnd = performance.now();
          console.log(`[MERGE] [PERF] RID: ${requestId} | Pricing: ${(pricingEnd - pricingStart).toFixed(2)}ms`);

          pricingData.items.forEach(p => {
            pricingMap.set(p.packageId, {
              packagePrice: p.breakdown.packageAmount + p.breakdown.guestScaling,
              addonPrice: p.breakdown.addonAmount,
              gst: p.breakdown.gstAmount,
              platformFee: p.breakdown.platformFee,
              discount: p.breakdown.vendorDiscount + p.breakdown.couponDiscount,
              totalPrice: p.breakdown.totalAmount,
              priceSnapshot: p.breakdown.totalAmount
            });
          });
        } catch (e) {
          console.error("[Merge] Batch pricing error:", e);
        }
      }

      // Optimized: Batch Upsert via Transaction to prevent connection pool exhaustion
      const upsertStart = performance.now();

      // Fetch current items to decide between update and create
      const existingItems = await prisma.cartitem.findMany({
        where: { cartId: cart.id },
        select: { targetId: true, type: true }
      });

      const existingSet = new Set(existingItems.map(i => `${i.targetId}_${i.type}`));

      await prisma.$transaction(
        cartItems.map(item => {
          const pricingDetails = pricingMap.get(item.targetId) || {};
          const isExisting = existingSet.has(`${item.targetId}_${item.type}`);

          if (isExisting) {
            return prisma.cartitem.update({
              where: {
                cartId_targetId_type: {
                  cartId: cart.id!,
                  targetId: item.targetId,
                  type: item.type
                }
              },
              data: {
                quantity: { increment: item.quantity },
                ...pricingDetails,
                updatedAt: new Date()
              }
            });
          } else {
            return prisma.cartitem.create({
              data: {
                id: crypto.randomUUID(),
                cartId: cart.id!,
                targetId: item.targetId,
                type: item.type,
                quantity: item.quantity,
                ...pricingDetails,
                updatedAt: new Date()
              }
            });
          }
        })
      );

      const upsertEnd = performance.now();
      console.log(`[MERGE] [PERF] RID: ${requestId} | Cart Transaction: ${(upsertEnd - upsertStart).toFixed(2)}ms`);
    }

    // 2. Merge Wishlist
    if (wishlistItems && Array.isArray(wishlistItems) && wishlistItems.length > 0) {
      const dbStart = performance.now();
      let wishlist = await prisma.wishlist.findUnique({
        where: { customerProfileId: profile.id }
      });

      if (!wishlist) {
        wishlist = await prisma.wishlist.create({
          data: {
            id: crypto.randomUUID(),
            customerProfileId: profile.id,
            updatedAt: new Date()
          }
        });
      }

      // Optimized: Fetch current items to decide between update and create
      const existingItems = await prisma.wishlistitem.findMany({
        where: { wishlistId: wishlist.id },
        select: { targetId: true, type: true }
      });

      const existingSet = new Set(existingItems.map(i => `${i.targetId}_${i.type}`));

      await prisma.$transaction(
        wishlistItems.map(item => {
          const targetId = typeof item === "string" ? item : item.targetId;
          const type = typeof item === "string" ? "SERVICE" : item.type;
          const isExisting = existingSet.has(`${targetId}_${type}`);

          if (isExisting) {
            return prisma.wishlistitem.update({
              where: {
                wishlistId_targetId_type: {
                  wishlistId: wishlist.id!,
                  targetId,
                  type
                }
              },
              data: { createdAt: new Date() }
            });
          } else {
            return prisma.wishlistitem.create({
              data: {
                id: crypto.randomUUID(),
                wishlistId: wishlist.id!,
                targetId,
                type
              }
            });
          }
        })
      );
      const dbEnd = performance.now();
      console.log(`[MERGE] [PERF] RID: ${requestId} | Wishlist Transaction: ${(dbEnd - dbStart).toFixed(2)}ms`);
    }
    const dbEnd = performance.now();

    const totalTime = performance.now() - start;
    console.log(`[MERGE] [PERF] RID: ${requestId} | User: ${payload.userId} | Total: ${totalTime.toFixed(2)}ms | DB Total: ${(dbEnd - dbStart).toFixed(2)}ms`);

    return NextResponse.json({ message: "Merge successful" });
  } catch (error: any) {
    console.error("Merge error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
