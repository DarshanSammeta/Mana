import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

import logger from "@/lib/logger";

export async function POST(req: Request) {
  const startTime = process.hrtime();
  return withErrorHandler(async () => {
    const payload = await getAuthPayload(req);
    if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { type, targetId } = await req.json();

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

    const existingItem = await prisma.wishlistitem.findUnique({
      where: {
        wishlistId_targetId_type: {
          wishlistId: wishlist.id,
          targetId,
          type
        }
      }
    });

    let action = "added";
    if (existingItem) {
      await prisma.wishlistitem.delete({ where: { id: existingItem.id } });
      action = "removed";
    } else {
      await prisma.wishlistitem.create({
        data: {
          id: crypto.randomUUID(),
          wishlistId: wishlist.id,
          type,
          targetId
        }
      });
    }

    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
    logger.info(`Wishlist POST API Performance (${action}): ${duration}ms`);

    return NextResponse.json({ message: action === "added" ? "Added to wishlist" : "Removed from wishlist", action });
  }, req);
}

export async function GET(req: Request) {
  const startTime = process.hrtime();
  return withErrorHandler(async () => {
    const payload = await getAuthPayload(req);
    if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const dbStartTime = process.hrtime();
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: payload.userId },
      select: {
        id: true,
        userId: true,
        wishlistitem: {
          select: {
            id: true,
            type: true,
            targetId: true,
            createdAt: true
          }
        }
      }
    });

    if (!wishlist) {
      const dbEndTime = process.hrtime(dbStartTime);
      const dbDuration = (dbEndTime[0] * 1000 + dbEndTime[1] / 1000000).toFixed(2);
      const endTime = process.hrtime(startTime);
      const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
      logger.info(`Wishlist GET API Performance (Empty): ${duration}ms (DB: ${dbDuration}ms)`);
      return NextResponse.json({ items: [] });
    }

    const vendorIds = wishlist.wishlistitem.filter(i => i.type === "VENDOR").map(i => i.targetId);
    const serviceIds = wishlist.wishlistitem.filter(i => i.type === "SERVICE").map(i => i.targetId);
    const packageIds = wishlist.wishlistitem.filter(i => i.type === "PACKAGE").map(i => i.targetId);

    const [vendors, services, packages] = await Promise.all([
      vendorIds.length > 0 ? prisma.vendorprofile.findMany({
        where: { id: { in: vendorIds } },
        select: {
          id: true,
          businessName: true,
          logo: true,
          city: true,
          rating: true,
          reviewCount: true
        }
      }) : [],
      serviceIds.length > 0 ? prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: {
          id: true,
          title: true,
          basePrice: true,
          vendorprofile: {
            select: {
              id: true,
              businessName: true
            }
          }
        }
      }) : [],
      packageIds.length > 0 ? prisma.renamedpackage.findMany({
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
                  businessName: true
                }
              }
            }
          }
        }
      }) : []
    ]);
    const dbEndTime = process.hrtime(dbStartTime);
    const dbDuration = (dbEndTime[0] * 1000 + dbEndTime[1] / 1000000).toFixed(2);

    const itemsWithDetails = wishlist.wishlistitem.map(item => {
      let details = null;
      if (item.type === "VENDOR") {
        details = vendors.find(v => v.id === item.targetId);
      } else if (item.type === "SERVICE") {
        details = services.find(s => s.id === item.targetId);
      } else if (item.type === "PACKAGE") {
        details = packages.find(p => p.id === item.targetId);
      }
      return { ...item, details };
    });

    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
    logger.info(`Wishlist GET API Performance: ${duration}ms (DB: ${dbDuration}ms)`);

    return NextResponse.json({ ...wishlist, items: itemsWithDetails });
  }, req);
}

