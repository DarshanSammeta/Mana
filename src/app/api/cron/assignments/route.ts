import { APP_CONFIG } from "@/config/app";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subMinutes } from "date-fns";
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

    const { handleVendorTimeout, reassignVendor } = await import("@/lib/intelligence/assignment");

    for (const assignment of expiredAssignments) {
      try {
          await handleVendorTimeout(assignment.bookingId, assignment.vendorId);
          results.push({ bookingId: assignment.bookingId, status: "REASSIGNED" });
      } catch (err) {
          logger.error("Failed to reassign booking in cron", { bookingId: assignment.bookingId, error: err });
          results.push({ bookingId: assignment.bookingId, status: "FAILED" });
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
      try {
          await reassignVendor(b.id);
          logger.info("Reassigned booking via reassignVendor helper", { bookingId: b.id });
      } catch (err) {
          logger.error("reassignVendor failed for booking", { bookingId: b.id, error: err });
      }
    }

    return NextResponse.json({ success: true, results });
  });
}
