import { APP_CONFIG } from "@/config/app";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // Simple security check for cron (can be improved with a secret token)
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (APP_CONFIG.cronSecret && key !== APP_CONFIG.cronSecret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // 1. Find all active subscriptions that have expired
    const expiredSubscriptions = await prisma.vendorsubscription.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          lt: now,
        },
        subscriptionplan: {
          name: {
            not: "FREE"
          }
        }
      },
      include: {
        subscriptionplan: true,
        vendorprofile: true
      }
    });

    if (expiredSubscriptions.length === 0) {
      return NextResponse.json({ message: "No expired subscriptions found" });
    }

    // 2. Find the FREE plan ID
    const freePlan = await prisma.subscriptionplan.findUnique({
      where: { name: "FREE" }
    });

    if (!freePlan) {
      throw new Error("FREE subscription plan not found");
    }

    const results = [];

    // 3. Process each expired subscription
    for (const sub of expiredSubscriptions) {
      // Logic for downgrade:
      // In this simple implementation, we update the existing record to FREE plan
      // and extend the date (or just mark as EXPIRED and create/update to FREE)

      // Option A: Update current record to EXPIRED and then we need a way to handle the "current" subscription.
      // Looking at schema, VendorSubscription is 1:1 with VendorProfile (unique vendorProfileId).
      // So we should update it to FREE.

      await prisma.vendorsubscription.update({
        where: { id: sub.id },
        data: {
          planId: freePlan.id,
          status: "ACTIVE", // FREE is always active
          startDate: now,
          endDate: new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years for free
          autoRenew: true
        }
      });

      // Optionally: Send notification to vendor
      // Note: Assuming notification table and relation names
      try {
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: sub.vendorprofile.userId,
            title: "Subscription Expired",
            message: `Your ${sub.subscriptionplan.name} subscription has expired. You have been moved to the FREE plan.`,
            category: "SYSTEM",
            priority: "MEDIUM"
          }
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }

      results.push({ vendorId: sub.vendorProfileId, oldPlan: sub.subscriptionplan.name });
    }

    return NextResponse.json({
      message: `Processed ${expiredSubscriptions.length} expired subscriptions`,
      downgraded: results
    });

  } catch (error) {
    console.error("Cron subscription error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
