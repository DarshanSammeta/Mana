import { prisma } from "@/lib/prisma";

export async function getVendorReviews(userId: string) {
  const vendor = await prisma.vendorprofile.findUnique({
    where: { userId }
  });

  if (!vendor) return [];

  return await prisma.review.findMany({
    where: { vendorId: vendor.id },
    include: {
      user: {
        select: { fullName: true }
      },
      vendorprofile: {
        select: { businessName: true }
      },
      service: {
        select: { title: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getCustomerReviews(userId: string) {
  return await prisma.review.findMany({
    where: { userId },
    include: {
      user: {
        select: { fullName: true }
      },
      vendorprofile: {
        select: { businessName: true }
      },
      service: {
        select: { title: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}
