import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { sendSMS } from "@/lib/sms/twilio";
import { generateAndUploadInvoice } from "@/lib/pdf/generator";
import logger from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";

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

    // Permission check
    if (payload.role === "VENDOR" && booking.vendorprofile.userId !== payload.userId) {
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

      // Step 10: Handle Payout when event is completed
      if (status === "EVENT_COMPLETED" && booking.status !== "EVENT_COMPLETED") {
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
      }

      return updated;
    });

    // Background Processing for Notifications, SMS, and Invoices
    (async () => {
      try {
        if (status === "VENDOR_TRAVELING") {
          await sendSMS(booking.user.mobileNumber, `Your vendor ${booking.vendorprofile?.businessName} is on the way for "${booking.eventName}"!`);
        }

        if (status === "VENDOR_ARRIVED") {
          const checkin = await prisma.eventcheckin.findUnique({ where: { bookingId } });
          if (checkin) {
            await sendSMS(booking.user.mobileNumber, `Your vendor has arrived! Provide OTP ${checkin.otp} to start the event.`);
          }
        }

        if (status === "EVENT_COMPLETED" && booking.status !== "EVENT_COMPLETED") {
          // Generate and Save Invoice
          const { invoiceNumber, pdfUrl } = await generateAndUploadInvoice(updatedBooking);
          await prisma.invoice.create({
            data: {
              id: crypto.randomUUID(),
              bookingId: updatedBooking.id,
              invoiceNumber,
              pdfUrl,
              createdAt: new Date()
            }
          });

          await sendSMS(booking.user.mobileNumber, `Event Completed! Your invoice #${invoiceNumber} is now available in the app. Please rate your experience!`);
        }
      } catch (err) {
        logger.error("Background processing error in booking status update", { error: err, bookingId });
      }
    })();

    // Create notification for the other party
    const notificationUserId = payload.role === "VENDOR" ? booking.customerId : booking.vendorprofile.userId;
    const notification = await prisma.notification.create({
        data: {
            id: crypto.randomUUID(),
            userId: notificationUserId,
            title: "Booking Update",
            message: `Booking ${booking.bookingNumber} status changed to ${status}`,
            category: "BOOKING",
            link: `/customer/bookings/${booking.id}`
        }
    });

    // Real-time Update via Socket
    try {
      const { emitSocketEvent } = await import("@/lib/socket-helper");
      emitSocketEvent(notificationUserId, "NOTIFICATION_RECEIVED", notification);
      emitSocketEvent(notificationUserId, "BOOKING_UPDATED", {
        bookingId: booking.id,
        status: status,
        message: `Your booking status is now ${status}`
      });
    } catch (socketError) {
      logger.error("Socket emission failed for booking status update", { error: socketError, bookingId: booking.id });
    }

    // Create Activity Log
    await prisma.activitylog.create({
        data: {
            id: crypto.randomUUID(),
            userId: payload.userId,
            action: "BOOKING_STATUS_UPDATE",
            details: `Changed booking ${booking.bookingNumber} status to ${status}`
        }
    });

    return NextResponse.json(updatedBooking);
  });
}
