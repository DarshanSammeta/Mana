import { APP_CONFIG } from "@/config/app";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subMinutes } from "date-fns";
import { sendSMS } from "@/lib/sms/twilio";
import logger from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    // Security check for Cron
    const authHeader = req.headers.get("authorization");
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${APP_CONFIG.cronSecret}`) {
      logger.warn("Unauthorized Cron Access Attempt", { ip: req.headers.get("x-forwarded-for") });
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const thirtyMinutesAgo = subMinutes(new Date(), 30);

    // 1. Find expired pending assignments
    const expiredAssignments = await prisma.bookingassignment.findMany({
      where: {
        status: "PENDING",
        createdAt: { lte: thirtyMinutesAgo },
      },
      include: {
        booking: true,
        vendorprofile: { include: { user: true } },
      },
    });

    const results = [];
    logger.info(`Running auto-reassign cron. Found ${expiredAssignments.length} expired assignments.`);

    for (const assignment of expiredAssignments) {
      // Mark current as EXPIRED
      await prisma.bookingassignment.update({
        where: { id: assignment.id },
        data: { status: "EXPIRED" },
      });

      // Find if there's a next vendor in line for this booking
      const nextAssignment = await prisma.bookingassignment.findFirst({
        where: {
          bookingId: assignment.bookingId,
          status: "PENDING",
          priority: { gt: assignment.priority },
        },
        orderBy: { priority: "asc" },
        include: { vendorprofile: { include: { user: true } } }
      });

      if (nextAssignment) {
        // Notify the next vendor
        await sendSMS(
          nextAssignment.vendorprofile.user.mobileNumber,
          `Urgent: A new booking #${assignment.booking.bookingNumber} is now available for you! Accept within 30 mins.`
        );

        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: nextAssignment.vendorprofile.userId,
            title: "New Priority Booking",
            message: `Booking #${assignment.booking.bookingNumber} is now assigned to you.`,
            category: "BOOKING",
            priority: "HIGH",
            link: `/vendor/bookings/${assignment.bookingId}`
          }
        });

        results.push({ bookingId: assignment.bookingId, status: "REASSIGNED_TO_NEXT" });
        logger.info("Booking reassigned to next vendor", { bookingId: assignment.bookingId, vendorId: nextAssignment.vendorId });
      } else {
        results.push({ bookingId: assignment.bookingId, status: "NO_MORE_VENDORS" });
        logger.warn("No more vendors available for booking", { bookingId: assignment.bookingId });
      }
    }

    // 2. Handle Reassignment from 5d Availability Rejection
    const reassignPending = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        vendorId: "reassigning"
      }
    });

    for (const b of reassignPending) {
      const previousAssignments = await prisma.bookingassignment.findMany({
        where: { bookingId: b.id },
        select: { vendorId: true }
      });
      const previousIds = previousAssignments.map(a => a.vendorId);

      const nextVendor = await prisma.vendorprofile.findFirst({
        where: {
          id: { notIn: previousIds },
          verificationStatus: "APPROVED"
        },
        orderBy: { rating: "desc" }
      });

      if (nextVendor) {
        await prisma.bookingassignment.create({
          data: {
            id: crypto.randomUUID(),
            bookingId: b.id,
            vendorId: nextVendor.id,
            priority: previousIds.length + 1,
            status: "PENDING",
            updatedAt: new Date()
          }
        });
        await prisma.booking.update({
          where: { id: b.id },
          data: { vendorId: nextVendor.id }
        });
        logger.info("Found replacement vendor for rejected booking", { bookingId: b.id, vendorId: nextVendor.id });
      }
    }

    return NextResponse.json({ success: true, results });
  });
}
