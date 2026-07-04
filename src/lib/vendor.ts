import { prisma } from "@/lib/prisma";
import { startOfMonth, subDays } from "date-fns";
import { unstable_cache } from "next/cache";

/**
 * Recursively converts Prisma Decimals to Numbers to satisfy Next.js
 * Client Component serialization requirements while preserving Date objects.
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

  // Handle Date objects (keep them as is, Next.js can serialize them)
  if (data instanceof Date) {
    return data;
  }

  // Handle Objects
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializeData(data[key]);
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
  { revalidate: 86400, tags: ['subscriptions'] } // 24 hours
);

export async function getVendorBaseContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      vendorprofile: {
        select: {
          id: true,
          _count: { select: { booking: true } },
          vendorsubscription: {
            select: {
              id: true,
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
}

export async function getVendorSubscriptionData(vendorProfile: any) {
  const [plans, serviceCount] = await Promise.all([
    getCachedSubscriptionPlans(),
    prisma.service.count({ where: { vendorProfileId: vendorProfile.id } })
  ]);

  return serializeData({
    currentSubscription: vendorProfile.vendorsubscription,
    plans,
    usage: {
      services: serviceCount,
      limit: vendorProfile.vendorsubscription?.subscriptionplan.listingLimit || 3
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
          user: { select: { fullName: true } },
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
      user: { select: { fullName: true, mobileNumber: true, email: true } },
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
