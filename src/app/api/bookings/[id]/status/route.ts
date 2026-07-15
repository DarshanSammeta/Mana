import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { isValidTransition } from "@/lib/booking-state-machine";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { status, notes } = await req.json();
    const bookingId = id;

    logger.info("Updating booking status", { bookingId, status, userId: payload.userId });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        customerId: true,
        bookingNumber: true,
        status: true,
        eventName: true,
        vendorprofile: {
          select: {
            id: true,
            userId: true,
            businessName: true
          }
        },
        user: {
          select: {
            mobileNumber: true
          }
        }
      }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // State Transition Validation
    if (!isValidTransition(booking.status, status)) {
        logger.warn("Invalid status transition attempted", {
            bookingId,
            currentStatus: booking.status,
            requestedStatus: status,
            userId: payload.userId
        });
        return NextResponse.json({
            message: `Invalid status transition from ${booking.status} to ${status}`
        }, { status: 400 });
    }

    // Permission check
    if (payload.role === "VENDOR" && (!booking.vendorprofile || booking.vendorprofile.userId !== payload.userId)) {
        logger.warn("Unauthorized status update attempt", { bookingId, userId: payload.userId });
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status,
          bookingstatuslog: {
            create: {
              id: crypto.randomUUID(),
              status,
              notes
            }
          }
        },
        select: {
          id: true,
          bookingNumber: true,
          customerId: true,
          status: true,
          totalAmount: true,
          subTotal: true,
          taxAmount: true,
          vendorPayout: true,
          eventDate: true,
          eventName: true,
          vendorprofile: {
            select: {
              id: true,
              userId: true,
              businessName: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  mobileNumber: true,
                  email: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              fullName: true,
              mobileNumber: true,
              email: true
            }
          },
          bookingitem: {
            select: {
              id: true,
              price: true,
              quantity: true,
              service: {
                select: {
                  id: true,
                  title: true,
                  basePrice: true
                }
              },
              Renamedpackage: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      // --- DYNAMIC FLOW LOGIC (Based on Flow Diagram) ---

      // Step 6 & 7: Booking Confirmed & Chat Initialization
      if (status === "CONFIRMED") {
        const existingChat = await tx.conversation.findUnique({
          where: { bookingId: updated.id }
        });

        if (!existingChat) {
          await tx.conversation.create({
            data: {
              id: crypto.randomUUID(),
              bookingId: updated.id,
              updatedAt: new Date(),
              conversationparticipant: {
                create: [
                  { id: crypto.randomUUID(), userId: updated.customerId },
                  { id: crypto.randomUUID(), userId: updated.vendorprofile!.userId }
                ]
              }
            }
          });
        }
      }

      if (status === "VENDOR_ARRIVED") {
        const checkinOtp = Math.floor(100000 + Math.random() * 900000).toString();
        await tx.eventcheckin.upsert({
          where: { bookingId },
          update: { otp: checkinOtp, status: "PENDING", generatedAt: new Date() },
          create: { id: crypto.randomUUID(), bookingId, otp: checkinOtp, status: "PENDING" }
        });
      }

      // Step 2: "Start Journey" logic integrated within status update
      // When status becomes VENDOR_TRAVELING, it "unlocks" customer address visibility
      // (handled in the GET /api/bookings/[id] route) and we can log the journey start.
      if (status === "VENDOR_TRAVELING") {
          // Additional logging or logic for journey start can be added here
      }

    // Step 10: Handle Payout when event is completed (REMOVED: Payout should happen after CUSTOMER_CONFIRMED/PAYMENT_RELEASED phase)
    if (status === "PAYMENT_RELEASED" && booking.status !== "PAYMENT_RELEASED" && updated.vendorprofile) {
      const vendorUserId = updated.vendorprofile.userId;
      const payoutAmount = updated.vendorPayout;

      let wallet = await tx.wallet.findUnique({
        where: { userId: vendorUserId }
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            id: crypto.randomUUID(),
            userId: vendorUserId,
            balance: 0,
            type: "VENDOR"
          }
        });
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: payoutAmount },
          lifetimeEarnings: { increment: payoutAmount },
          withdrawable: { increment: payoutAmount }
        }
      });

      await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          walletId: wallet.id,
          bookingId: bookingId,
          amount: payoutAmount,
          type: "CREDIT",
          status: "COMPLETED",
          description: `Payout for booking #${updated.bookingNumber}`
        }
      });

      // --- NEW: Settlement Record for Finance module ---
      await tx.settlement.create({
          data: {
              id: crypto.randomUUID(),
              vendorId: updated.vendorprofile!.id,
              amount: updated.totalAmount,
              commissionCharged: (updated as any).commissionAmount || 0,
              taxDeducted: updated.taxAmount,
              netAmount: payoutAmount,
              status: "COMPLETED",
              periodStart: new Date(),
              periodEnd: new Date(),
              reference: updated.bookingNumber,
              auditLog: { source: "status_update_payment_released" }
          }
      });
    }

      return updated;
    });

    // Background Processing for Notifications, SMS, and Invoices moved to Inngest
    try {
      const { inngest } = await import("@/lib/inngest");
      await inngest.send({
        name: "booking/status.updated",
        data: {
          bookingId: updatedBooking.id,
          status: status,
          previousStatus: booking.status
        }
      });
    } catch (inngestError) {
      logger.error("Failed to trigger inngest for booking status update", { error: inngestError, bookingId });
    }

    // Centralized Notification Trigger (Phase 2)
    try {
      const { NotificationTriggers } = await import("@/lib/notifications");
      await NotificationTriggers.bookingStatusUpdated(updatedBooking, status);
    } catch (notifyError) {
      logger.error("Failed to trigger notification for booking status update", { error: notifyError, bookingId });
    }

    // Create Activity Log
    await createAuditLog({
        userId: payload.userId,
        action: "BOOKING_STATUS_UPDATE",
        details: {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            status,
            previousStatus: booking.status
        },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown"
    });

    return NextResponse.json(updatedBooking);
  });
}
