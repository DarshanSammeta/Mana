import { prisma } from "@/lib/prisma";
import { startOfMonth, subDays } from "date-fns";
import { unstable_cache } from "next/cache";
import { CacheManager } from "./cache-manager";
import logger from "./logger";

/**
 * Normalizes subscription plan features into a guaranteed string array.
 * Handles:
 * - string[] (pass through)
 * - JSON string (parse and validate)
 * - Object (convert truthy keys to strings)
 * - Null/Undefined (empty array)
 */
function normalizeFeatures(features: any): string[] {
  logger.info("Normalizing features", { type: typeof features, data: features });
  if (features === null || features === undefined) return [];

  let val = features;

  // 1. Handle JSON stringified data
  if (typeof val === 'string') {
    try {
      val = JSON.parse(val);
    } catch {
      return [];
    }
  }

  // 2. Handle Arrays
  if (Array.isArray(val)) {
    return val.filter((item: any) => typeof item === 'string');
  }

  // 3. Handle Objects (e.g. { analytics: true } -> ["analytics"])
  if (typeof val === 'object' && val !== null) {
    return Object.entries(val)
      .filter(([_, enabled]) => !!enabled)
      .map(([key]) => key);
  }

  return [];
}

/**
 * Recursively converts Prisma Decimals to Numbers and normalizes subscription features.
 */
function serializeData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }

  // Handle Prisma Decimal (detecting by properties d, s, e)
  if (typeof data === 'object' && data.hasOwnProperty('d') && data.hasOwnProperty('s') && data.hasOwnProperty('e')) {
    return Number(data);
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data;
  }

  // Handle Objects
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Normalization Layer: Coerce subscription features to string[]
        // We detect a plan object by its known fields: listingLimit or rank
        if (key === 'features' && (data.listingLimit !== undefined || data.rank !== undefined)) {
            result[key] = normalizeFeatures(data[key]);
        } else {
            result[key] = serializeData(data[key]);
        }
      }
    }
    return result;
  }

  return data;
}

const getCachedSubscriptionPlans = unstable_cache(
  async () => {
    return prisma.subscriptionplan.findMany({ orderBy: { rank: 'asc' } });
  },
  ['subscription-plans'],
  { revalidate: 300, tags: ['subscriptions'] } // 5 minutes
);

export async function getVendorBaseContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      vendorprofile: {
        select: {
          id: true,
          verificationStatus: true,
          rejectionReason: true,
          rejectedDocuments: true,
          _count: { select: { booking: true } },
          vendorsubscription: {
            select: {
              id: true,
              planId: true,
              status: true,
              startDate: true,
              endDate: true,
              autoRenew: true,
              createdAt: true,
              updatedAt: true,
              subscriptionplan: {
                select: {
                  id: true,
                  name: true,
                  listingLimit: true,
                  price: true,
                  features: true,
                  rank: true
                }
              }
            }
          }
        }
      },
      wallet: {
        select: {
          id: true,
          lifetimeEarnings: true,
          pendingBalance: true,
          withdrawable: true
        }
      }
    }
  });

  return serializeData(user);
}

export async function getVendorStats(walletId: string | undefined, totalBookings: number) {
  if (!walletId) {
    return {
      totalRevenue: 0, pendingRevenue: 0, withdrawableRevenue: 0,
      totalBookings, monthlyRevenue: 0, dailyRevenue: []
    };
  }

  return await CacheManager.get(
    `vendor:stats:${walletId}`,
    async () => {
      const monthStart = startOfMonth(new Date());
      const thirtyDaysAgo = subDays(new Date(), 30);

      const [monthlyRevenue, dailyRevenue, walletData] = await Promise.all([
        prisma.transaction.aggregate({
          where: { walletId, type: 'CREDIT', createdAt: { gte: monthStart } },
          _sum: { amount: true }
        }),
        prisma.transaction.findMany({
          where: { walletId, type: 'CREDIT', createdAt: { gte: thirtyDaysAgo } },
          select: { createdAt: true, amount: true }
        }),
        prisma.wallet.findUnique({
          where: { id: walletId },
          select: { lifetimeEarnings: true, pendingBalance: true, withdrawable: true }
        })
      ]);

      const dailyRevenueFormatted = dailyRevenue.reduce((acc: Record<string, number>, curr) => {
        const date = curr.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + Number(curr.amount || 0);
        return acc;
      }, {});

      return serializeData({
        totalRevenue: Number(walletData?.lifetimeEarnings || 0),
        pendingRevenue: Number(walletData?.pendingBalance || 0),
        withdrawableRevenue: Number(walletData?.withdrawable || 0),
        totalBookings,
        monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
        dailyRevenue: Object.entries(dailyRevenueFormatted).map(([date, amount]) => ({ date, amount }))
      });
    },
    300 // 5 minutes TTL
  );
}

export async function getVendorSubscriptionData(vendorProfile: any) {
  const [plans, serviceCount] = await Promise.all([
    getCachedSubscriptionPlans(),
    prisma.service.count({ where: { vendorProfileId: vendorProfile.id } })
  ]);

  const currentSubscription = vendorProfile.vendorsubscription;

  // Data Integrity Check
  if (currentSubscription && currentSubscription.status === "ACTIVE") {
    if (!currentSubscription.startDate || !currentSubscription.endDate) {
      logger.warn("Corrupted subscription record found: Active subscription missing dates", {
        vendorId: vendorProfile.id,
        subscriptionId: currentSubscription.id,
        startDate: currentSubscription.startDate,
        endDate: currentSubscription.endDate
      });
    }
  }

  return serializeData({
    currentSubscription,
    plans,
    usage: {
      services: serviceCount,
      limit: currentSubscription?.subscriptionplan.listingLimit || 3
    }
  });
}

export async function getVendorSubscription(userId: string) {
  const context = await getVendorBaseContext(userId);
  if (!context?.vendorprofile) return null;
  return getVendorSubscriptionData(context.vendorprofile);
}

export async function getVendorAssignments(vendorId: string) {
  const assignments = await prisma.bookingassignment.findMany({
    where: { vendorId, status: "PENDING" },
    select: {
      id: true,
      priority: true,
      createdAt: true,
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          eventName: true,
          eventDate: true,
          totalAmount: true,
          customerprofile: {
            select: {
              user: {
                select: {
                  fullName: true
                }
              }
            }
          },
          bookingitem: {
            select: {
              id: true,
              price: true,
              quantity: true,
              service: { select: { title: true } },
              Renamedpackage: { select: { name: true } }
            }
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return serializeData(assignments);
}

export async function getVendorRecentBookings(vendorId: string, limit = 5) {
  const bookings = await prisma.booking.findMany({
    where: { vendorId },
    select: {
      id: true,
      bookingNumber: true,
      eventName: true,
      eventDate: true,
      totalAmount: true,
      status: true,
      customerprofile: {
        select: {
          user: {
            select: {
              fullName: true,
              mobileNumber: true,
              email: true
            }
          }
        }
      },
      bookingitem: {
        select: {
          id: true,
          price: true,
          quantity: true,
          service: { select: { title: true } },
          Renamedpackage: { select: { name: true } }
        }
      },
      payment: {
        select: {
          id: true,
          status: true,
          amount: true
        }
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return serializeData(bookings);
}
