import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { PricingEngine } from "@/services/server/pricing.engine";

export async function GET(req: Request) {
  const start = performance.now();
  const requestId = req.headers.get("x-request-id") || "unknown";

  return withErrorHandler(async () => {
    const authHeader = req.headers.get("Authorization");
    const cookieToken = req.headers.get("cookie")?.split("; ").find(c => c.startsWith("accessToken="))?.split("=")[1];
    const token = authHeader?.split(" ")[1] || cookieToken;

    if (!token) {
        console.error(`[CART GET] [401] No token found. RID: ${requestId}`);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const authStart = performance.now();
    const payload = await verifyAccessToken(token);
    const authEnd = performance.now();

    if (!payload) {
        console.error(`[CART GET] [401] Invalid token. RID: ${requestId}`);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const dbStart = performance.now();
    const profile = await prisma.customerprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!profile) return NextResponse.json({ items: [] });

    const cart = await prisma.cart.findUnique({
      where: { customerProfileId: profile.id },
      include: { cartitem: true }
    });

    if (!cart) return NextResponse.json({ items: [] });

    // Optimized: Batch fetch details
    const packageIds = cart.cartitem.filter(i => i.type === "PACKAGE").map(i => i.targetId);
    const serviceIds = cart.cartitem.filter(i => i.type !== "PACKAGE").map(i => i.targetId);

    const [packages, services] = await Promise.all([
      prisma.renamedpackage.findMany({
        where: { id: { in: packageIds } },
        include: {
          service: {
            include: {
              vendorprofile: {
                select: { id: true, businessName: true, logo: true, city: true }
              }
            }
          }
        }
      }),
      prisma.service.findMany({
        where: { id: { in: serviceIds } },
        include: {
          vendorprofile: {
            select: { id: true, businessName: true, logo: true, city: true }
          }
        }
      })
    ]);

    const packageMap = new Map(packages.map(p => [p.id, p]));
    const serviceMap = new Map(services.map(s => [s.id, s]));

    const itemsWithDetails = cart.cartitem.map((item) => {
      const details = item.type === "PACKAGE" ? packageMap.get(item.targetId) : serviceMap.get(item.targetId);
      return { ...item, details };
    });
    const dbEnd = performance.now();

    const totalTime = performance.now() - start;
    console.log(`[CART GET] [PERF] RID: ${requestId} | User: ${payload.userId} | Auth: ${(authEnd - authStart).toFixed(2)}ms | DB: ${(dbEnd - dbStart).toFixed(2)}ms | Total: ${totalTime.toFixed(2)}ms`);

    return NextResponse.json({ ...cart, items: itemsWithDetails });
  }, req);
}


export async function POST(req: Request) {
  const start = performance.now();
  const requestId = req.headers.get("x-request-id") || "unknown";

  return withErrorHandler(async () => {
    const authHeader = req.headers.get("Authorization");
    const cookieToken = req.headers.get("cookie")?.split("; ").find(c => c.startsWith("accessToken="))?.split("=")[1];
    const token = authHeader?.split(" ")[1] || cookieToken;

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const authStart = performance.now();
    const payload = await verifyAccessToken(token);
    const authEnd = performance.now();

    if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const dbStart = performance.now();
    const profile = await prisma.customerprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

    const body = await req.json();
    const {
        type,
        targetId,
        quantity = 1,
        vendorId,
        packageId,
        eventDate,
        eventTime,
        guestCount,
        location,
        notes,
        addons
    } = body;

    let cart = await prisma.cart.findUnique({
      where: { customerProfileId: profile.id }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerProfileId: profile.id }
      });
    }

    // Calculate Enterprise Pricing Snapshot
    let pricingDetails: any = {};
    if (type === "PACKAGE") {
        const pricing = await PricingEngine.calculateMultiItemPrice([{
            packageId: targetId,
            guestCount: guestCount || 100,
            addonIds: addons || []
        }]);
        const itemPricing = pricing.items[0].breakdown;
        pricingDetails = {
            packagePrice: itemPricing.packageAmount + itemPricing.guestScaling,
            addonPrice: itemPricing.addonAmount,
            gst: itemPricing.gstAmount,
            platformFee: itemPricing.platformFee,
            discount: itemPricing.vendorDiscount + itemPricing.couponDiscount,
            totalPrice: itemPricing.totalAmount,
            priceSnapshot: itemPricing.totalAmount
        };
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
        quantity,
        vendorId,
        packageId,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        eventTime,
        guestCount,
        location,
        notes,
        addons,
        ...pricingDetails
      },
      create: {
        cartId: cart.id,
        targetId,
        type,
        quantity,
        vendorId,
        packageId,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        eventTime,
        guestCount,
        location,
        notes,
        addons,
        ...pricingDetails
      }
    });
    const dbEnd = performance.now();

    const totalTime = performance.now() - start;
    console.log(`[CART POST] [PERF] RID: ${requestId} | User: ${payload.userId} | Auth: ${(authEnd - authStart).toFixed(2)}ms | DB: ${(dbEnd - dbStart).toFixed(2)}ms | Total: ${totalTime.toFixed(2)}ms`);

    return NextResponse.json(item, { status: 201 });
  }, req);
}

export async function DELETE(req: Request) {
  // Existing delete logic remains same
  return withErrorHandler(async () => {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const profile = await prisma.customerprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!profile) return NextResponse.json({ message: "Cart empty" });

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
        const cart = await prisma.cart.findUnique({ where: { customerProfileId: profile.id } });
        if (cart) {
            await prisma.cartitem.deleteMany({ where: { cartId: cart.id } });
        }
        return NextResponse.json({ message: "Cart cleared" });
    }

    await prisma.cartitem.delete({ where: { id: itemId } });
    return NextResponse.json({ message: "Item removed from cart" });
  }, req);
}
