import { prisma } from "@/lib/prisma";
import { PricingEngine } from "./pricing.engine";
import { AuditService } from "./audit.service";
import { inngest } from "@/lib/inngest";

export class OrderService {
  /**
   * Creates an Order with Inventory Locks (Reservations)
   * Flow: Start TX -> Revalidate -> Lock -> Create
   */
  static async createOrder(customerId: string, payload: any) {
    const start = performance.now();
    const { items, eventDetails, couponCode, idempotencyKey } = payload;
    console.log(`[OrderService] createOrder UID: ${customerId} | Items: ${items?.length}`);

    // Pre-resolve context to avoid Dynamic API calls inside transaction
    const auditContext = await AuditService.resolveContext();

    // 1. Pre-calculate pricing (No lock needed)
    const normalizedItems = items.map((i: any) => ({
        packageId: i.packageId,
        guestCount: i.guestCount || eventDetails.guestCount || 100,
        addonIds: i.addonIds || i.selectedAddonIds || []
    }));

    const pricing = await PricingEngine.calculateMultiItemPrice(normalizedItems, couponCode);

    // 2. Perform Atomic Transaction
    console.log(`[OrderService] Entering transaction...`);
    return await prisma.$transaction(async (tx) => {
      // A. Check Idempotency
      if (idempotencyKey) {
          const existingOrder = await tx.order.findUnique({
              where: { idempotencyKey },
              include: { order_item: true, reservations: true }
          });
          if (existingOrder) return existingOrder;
      }

      // B. Revalidate Availability
      for (const item of pricing.items) {
          const vendorId = item.vendorId;
          const eventDate = new Date(eventDetails.date);

          const existingBooking = await tx.booking.findFirst({
              where: {
                  vendorId: vendorId,
                  eventDate,
                  status: { notIn: ["CANCELLED", "REJECTED"] }
              }
          });
          if (existingBooking) throw new Error(`Vendor ${item.details.serviceTitle} is already booked for this date.`);

          const existingRes = await tx.reservation.findFirst({
              where: {
                  vendorId: vendorId,
                  eventDate,
                  status: "ACTIVE",
                  expiresAt: { gt: new Date() }
              }
          });
          if (existingRes) throw new Error(`Vendor ${item.details.serviceTitle} has a pending reservation for this date.`);
      }

      // C. Create Master Order
      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerProfileId: customerId,
          status: "RESERVED",
          idempotencyKey,
          packageAmount: pricing.totalPackageAmount,
          addonAmount: pricing.totalAddonAmount,
          discountAmount: pricing.totalVendorDiscount + pricing.totalCouponDiscount,
          gstAmount: pricing.totalGst,
          platformFee: pricing.totalPlatformFee,
          totalAmount: pricing.grandTotal,
          advanceAmount: pricing.totalAdvance,
          balanceAmount: pricing.totalBalance,
          financialSnapshot: pricing as any,
          order_item: {
            create: pricing.items.map((item: any) => ({
              vendorId: item.vendorId,
              serviceId: item.packageId,
              packageId: item.packageId,
              quantity: 1,
              eventDate: new Date(eventDetails.date),
              eventTime: eventDetails.time,
              guestCount: eventDetails.guestCount,
              location: eventDetails.venue,
              packageAmount: item.breakdown.packageAmount + item.breakdown.guestScaling,
              addonAmount: item.breakdown.addonAmount,
              discountAmount: item.breakdown.vendorDiscount,
              gstAmount: item.breakdown.gstAmount,
              platformFee: item.breakdown.platformFee,
              totalAmount: item.breakdown.totalAmount,
              priceSnapshot: item.breakdown.subtotal,
              addons: item.details.addons,
            }))
          },
          reservations: {
            create: pricing.items.map((item: any) => ({
                vendorId: item.vendorId,
                eventDate: new Date(eventDetails.date),
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins TTL
                status: "ACTIVE"
            }))
          }
        },
        include: {
          order_item: true,
          reservations: true
        }
      });

      // D. Audit Log (Using pre-resolved context)
      await AuditService.log({
        entityType: "ORDER",
        entityId: order.id,
        module: "CHECKOUT",
        action: "ORDER_RESERVED",
        performedByUserId: customerId,
        metadata: {
            orderNumber: order.orderNumber,
            total: pricing.grandTotal,
            correlationId: `CORR-CH-${order.orderNumber}`
        },
        context: auditContext || undefined
      }, tx);

      console.log(`[OrderService] Order created in ${(performance.now() - start).toFixed(2)}ms`);
      return order;
    });
  }

  /**
   * Finalizes order and triggers async fulfillment
   */
  static async handlePaymentSuccess(orderId: string, paymentId: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: "PAYMENT_SUCCESS" },
        include: { order_item: true, reservations: true }
      });

      await tx.reservation.updateMany({
        where: { orderId: order.id, status: "ACTIVE" },
        data: { status: "CONFIRMED" }
      });

      await tx.payment.update({
        where: { id: paymentId },
        data: { orderId: order.id, status: "SUCCESS" }
      });

      const correlationId = `CORR-PY-${Date.now()}-${order.orderNumber}`;

      await inngest.send({
        name: "order/confirmed",
        data: { orderId: order.id, correlationId }
      });

      await AuditService.log({
        entityType: "ORDER",
        entityId: order.id,
        module: "PAYMENT",
        action: "PAYMENT_CONFIRMED",
        metadata: { paymentId, orderNumber: order.orderNumber, correlationId }
      }, tx);

      return order;
    });
  }

  /**
   * Periodic cleanup for expired reservations
   */
  static async cleanupExpiredReservations() {
    return await prisma.$transaction(async (tx) => {
        const expiredRes = await tx.reservation.findMany({
            where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
            select: { id: true, orderId: true }
        });

        if (expiredRes.length === 0) return 0;

        await tx.reservation.updateMany({
            where: { id: { in: expiredRes.map(r => r.id) } },
            data: { status: "EXPIRED" }
        });

        const orderIds = Array.from(new Set(expiredRes.map(r => r.orderId).filter(Boolean)));
        await tx.order.updateMany({
            where: { id: { in: orderIds as string[] }, status: "RESERVED" },
            data: { status: "CANCELLED" }
        });

        return expiredRes.length;
    });
  }
}
