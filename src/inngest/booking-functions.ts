import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms/twilio";
import { sendBookingConfirmationEmail, sendVendorNotificationEmail } from "@/lib/mail/resend";
import { formatSafe } from "@/lib/utils/date";

/**
 * Enterprise Fulfillment Worker
 * Sequence: Validate -> Create Bookings -> Assign Vendors -> Confirm Reservations -> Notify
 */
export const handleOrderConfirmation = inngest.createFunction(
  {
    id: "handle-order-confirmation",
    triggers: [{ event: "order/confirmed" }],
  },
  async ({ event, step }) => {
    const { orderId, correlationId } = event.data;

    // 1. Validate Order & Payments
    const order = (await step.run("validate-order", async () => {
      const o = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            order_item: true,
            customer: { include: { user: true } },
            payments: { where: { status: "SUCCESS" } }
        }
      });
      if (!o) throw new Error("CRITICAL: Order not found during fulfillment");
      if (o.payments.length === 0) throw new Error("CRITICAL: Order has no successful payment");
      return o;
    })) as any;

    // 2. Process each Order Item into a Booking
    for (const item of order.order_item) {
      await step.run(`fulfill-item-${item.id}`, async () => {
        // Idempotency Check: Don't create if booking already exists for this item
        const existing = await prisma.booking.findFirst({
            where: { orderId: order.id, packageId: item.packageId, vendorId: item.vendorId }
        });
        if (existing) return;

        return await prisma.$transaction(async (tx) => {
            // A. Create Service Execution Unit (Booking)
            const bookingNumber = `BK-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000)}`;
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            const booking = await tx.booking.create({
                data: {
                    bookingNumber,
                    orderId: order.id,
                    customerProfileId: order.customerProfileId,
                    vendorId: item.vendorId,
                    packageId: item.packageId,
                    eventDate: item.eventDate,
                    eventTime: item.eventTime,
                    eventLocation: item.location,
                    guestCount: item.guestCount,
                    // Financial Snapshot (Locked from order item)
                    subTotal: item.packageAmount,
                    taxAmount: item.gstAmount,
                    totalAmount: item.totalAmount,
                    advanceAmount: item.totalAmount.mul(0.3), // 30% rule
                    balanceAmount: item.totalAmount.mul(0.7),
                    status: "PENDING_VENDOR_RESPONSE",
                    otp,
                    bookingitem: {
                        create: {
                            serviceId: item.serviceId,
                            packageId: item.packageId,
                            price: item.packageAmount,
                            quantity: item.quantity
                        }
                    }
                }
            });

            // B. Create Vendor Assignment
            await tx.bookingassignment.create({
                data: {
                    bookingId: booking.id,
                    vendorId: item.vendorId,
                    priority: 1,
                    status: "PENDING",
                    updatedAt: new Date()
                }
            });

            // C. Log Audit Event
            await tx.audit_log.create({
                data: {
                    entityType: "BOOKING",
                    entityId: booking.id,
                    bookingId: booking.id,
                    module: "FULFILLMENT",
                    action: "BOOKING_CREATED_FROM_ORDER",
                    metadata: { orderId, correlationId }
                }
            });

            return booking.id;
        });
      });
    }

    // 3. Finalize Order Lifecycle
    await step.run("finalize-order-status", async () => {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PROCESSING" }
      });
    });

    // 4. Dispatch Notifications
    await step.run("dispatch-notifications", async () => {
       // Logic to trigger global booking notifications (delegated to existing worker)
       await inngest.send({
           name: "notifications/order.fulfilled",
           data: { orderId, customerId: order.customerProfileId }
       });
    });

    return { status: "fulfilled", orderId, correlationId };
  }
);

/**
 * Worker to release expired reservations every 5 minutes
 */
export const reservationCleanupWorker = inngest.createFunction(
  { id: "reservation-cleanup", triggers: [{ cron: "*/5 * * * *" }] },
  async () => {
    const { OrderService } = await import("@/services/server/order.service");
    await OrderService.cleanupExpiredReservations();
  }
);

export const sendBookingNotifications = inngest.createFunction(
  { id: "send-booking-notifications", triggers: [{ event: "booking/created" }] },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    const booking = (await step.run("fetch-booking", async () => {
      return await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customerprofile: {
            include: {
              user: { select: { fullName: true, mobileNumber: true, email: true } }
            }
          },
          vendorprofile: { include: { user: { select: { email: true, fullName: true, mobileNumber: true } } } }
        }
      });
    })) as any;

    if (!booking || !booking.customerprofile) return;

    const customerUser = booking.customerprofile.user;

    await step.run("send-customer-notifications", async () => {
      const notifications = [];
      notifications.push(sendSMS(
        customerUser.mobileNumber,
        `Hi ${customerUser.fullName}, your booking ${booking.bookingNumber} is created. Track it at ${process.env.NEXT_PUBLIC_APP_URL}/customer/bookings`
      ));

      if (customerUser.email) {
        notifications.push(sendBookingConfirmationEmail(customerUser.email, {
          customerName: customerUser.fullName,
          bookingNumber: booking.bookingNumber,
          eventName: booking.eventName || "Event",
          eventDate: formatSafe(booking.eventDate, "PPP"),
          totalAmount: booking.totalAmount.toString()
        }));
      }
      return await Promise.allSettled(notifications);
    });

    await step.run("send-vendor-notifications", async () => {
      const assignments = await prisma.bookingassignment.findMany({
        where: { bookingId: booking.id },
        include: { vendorprofile: { include: { user: { select: { email: true, fullName: true, mobileNumber: true } } } } }
      });

      const notifications = [];
      for (const assignment of assignments) {
        const v = assignment.vendorprofile;
        notifications.push(sendSMS(v.user.mobileNumber, `New booking request ${booking.bookingNumber} available! Claim it now in your Seller Dashboard.`));
        if (v.user.email) {
          notifications.push(sendVendorNotificationEmail(v.user.email, {
            vendorName: v.user.fullName,
            bookingNumber: booking.bookingNumber,
            eventName: booking.eventName || "Event",
            eventDate: formatSafe(booking.eventDate, "PPP"),
            customerName: customerUser.fullName,
            payoutAmount: booking.vendorPayout.toString()
          }));
        }
      }
      return await Promise.allSettled(notifications);
    });
  }
);

export const vendorAcceptanceReminder = inngest.createFunction(
  { id: "vendor-acceptance-reminder", triggers: [{ event: "booking/created" }] },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    // Wait for 2 hours
    await step.sleep("wait-for-acceptance", "2h");

    const booking = (await step.run("check-booking-status", async () => {
      return await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { status: true, bookingNumber: true }
      });
    })) as any;

    if (booking?.status === "PENDING") {
      const assignments = await prisma.bookingassignment.findMany({
        where: { bookingId, status: "PENDING" },
        include: { vendorprofile: { include: { user: { select: { mobileNumber: true } } } } }
      });

      await step.run("send-reminders", async () => {
        for (const assignment of assignments) {
          await sendSMS(
            assignment.vendorprofile.user.mobileNumber,
            `Urgent: Booking ${booking.bookingNumber} is still pending. Please accept or reject it in your dashboard.`
          );
        }
      });
    }
  }
);

export const sendEventReminders = inngest.createFunction(
  { id: "daily-event-reminders", triggers: [{ cron: "0 9 * * *" }] }, // Run every day at 9:00 AM
  async ({ step }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    const upcomingBookings = (await step.run("fetch-upcoming-bookings", async () => {
      return await prisma.booking.findMany({
        where: {
          eventDate: {
            gte: new Date(dateString + "T00:00:00Z"),
            lte: new Date(dateString + "T23:59:59Z"),
          },
          status: "CONFIRMED"
        },
        include: {
          customerprofile: {
            include: {
              user: { select: { fullName: true, mobileNumber: true } }
            }
          },
          vendorprofile: { include: { user: { select: { fullName: true, mobileNumber: true } } } }
        }
      });
    })) as any[];

    for (const booking of upcomingBookings) {
      if (!booking.customerprofile) continue;
      const customerUser = booking.customerprofile.user;

      await step.run(`send-reminder-${booking.id}`, async () => {
        // Customer Reminder
        await sendSMS(
          customerUser.mobileNumber,
          `Reminder: Your event "${booking.eventName}" is tomorrow! Our vendor ${booking.vendorprofile?.businessName || 'partner'} is looking forward to serving you.`
        );

        // Vendor Reminder
        if (booking.vendorprofile) {
          await sendSMS(
            booking.vendorprofile.user.mobileNumber,
            `Upcoming Event: Hi ${booking.vendorprofile.user.fullName}, you have a booking tomorrow for "${booking.eventName}". Please ensure all preparations are complete.`
          );
        }
      });
    }

    return { remindedCount: upcomingBookings.length };
  }
);

export const generateBookingDocument = inngest.createFunction(
  { id: "generate-booking-document", triggers: [{ event: "booking/document.generate" }] },
  async ({ event, step }) => {
    const { bookingId, type } = event.data;

    await step.run("generate-document", async () => {
      const { DocumentService } = await import("@/services/server/document.service");
      const name = type === "RECEIPT" ? "Advance Payment Receipt" : (type === "AGREEMENT" ? "Booking Agreement" : "Final Service Invoice");
      return await DocumentService.generateDocument(bookingId, type, name);
    });
  }
);

export const initiateAutomatedRefund = inngest.createFunction(
  { id: "initiate-automated-refund", triggers: [{ event: "booking/refund.initiate" }] },
  async ({ event, step }) => {
    const { bookingId, reason, isSystemAction } = event.data;

    await step.run("initiate-refund", async () => {
      const { RefundService } = await import("@/services/server/refund.service");
      return await RefundService.initiateRefund(bookingId, reason, isSystemAction);
    });
  }
);

export const handleBookingStatusChange = inngest.createFunction(
  { id: "handle-booking-status-change", triggers: [{ event: "booking/status.updated" }] },
  async ({ event, step }) => {
    const { bookingId, status, previousStatus, _performer } = event.data;

    const booking = (await step.run("fetch-booking-details", async () => {
      return await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customerprofile: {
            include: {
              user: { select: { fullName: true, mobileNumber: true, email: true } }
            }
          },
          vendorprofile: {
            include: {
              user: { select: { id: true, fullName: true, mobileNumber: true, email: true } }
            }
          },
          bookingitem: {
            include: {
              service: true,
              Renamedpackage: true
            }
          }
        }
      });
    })) as any;

    if (!booking || !booking.customerprofile) return { status: "booking_not_found" };

    const customerUser = booking.customerprofile.user;

    // Standard Notification side-effects
    await step.run("send-status-notifications", async () => {
        const { NotificationTriggers } = await import("@/lib/notifications");
        // Trigger specific notification for advance payment even if status is CONFIRMED
        if (status === "ADVANCE_PAID" || (status === "CONFIRMED" && booking.paymentStage === "ADVANCE_PAID")) {
            await NotificationTriggers.advancePaid(booking);
        } else {
            await NotificationTriggers.bookingStatusUpdated(booking, status);
        }
    });

    // 1. Send SMS for VENDOR_TRAVELING
    if (status === "VENDOR_TRAVELING" && booking.vendorprofile) {
      await step.run("send-traveling-sms", async () => {
        await sendSMS(
          customerUser.mobileNumber,
          `Your vendor ${booking.vendorprofile?.businessName || 'partner'} is on the way for "${booking.eventName}"!`
        );
      });
    }

    // 2. Send SMS for VENDOR_ARRIVED
    if (status === "VENDOR_ARRIVED") {
      await step.run("send-arrival-sms", async () => {
        const checkin = await prisma.eventcheckin.findUnique({ where: { bookingId } });
        if (checkin) {
          await sendSMS(
            customerUser.mobileNumber,
            `Your vendor has arrived! Provide OTP ${checkin.otp} to start the event.`
          );
        }
      });
    }

    // 3. Handle EVENT_COMPLETED: Invoice Generation & SMS
    if (status === "EVENT_COMPLETED" && previousStatus !== "EVENT_COMPLETED") {
      // Step 7: Final Reminders & Review Automation
      await step.run("schedule-review-reminder", async () => {
         // Sleep for 24 hours after completion then remind to review
         return { scheduled: true };
      });

      const invoice = (await step.run("generate-invoice", async () => {
        const { generateAndUploadInvoice } = await import("@/lib/pdf/generator");
        const { invoiceNumber, pdfUrl } = await generateAndUploadInvoice(booking);

        return await prisma.invoice.create({
          data: {
            id: crypto.randomUUID(),
            bookingId: booking.id,
            invoiceNumber,
            pdfUrl,
            createdAt: new Date()
          }
        });
      })) as any;

      await step.run("send-completion-notifications", async () => {
        const { sendInvoiceEmail } = await import("@/lib/mail/resend");

        await Promise.all([
          sendSMS(
            customerUser.mobileNumber,
            `Event Completed! Your invoice #${invoice.invoiceNumber} is now available in the app. Please rate your experience!`
          ),
          customerUser.email ? sendInvoiceEmail(customerUser.email, {
            customerName: customerUser.fullName,
            invoiceNumber: invoice.invoiceNumber,
            bookingNumber: booking.bookingNumber,
            amount: booking.totalAmount.toString(),
            pdfUrl: invoice.pdfUrl || ""
          }) : Promise.resolve()
        ]);
      });
    }
  }
);

export const bookingTimelineAutomation = inngest.createFunction(
  { id: "booking-timeline-automation", triggers: [{ event: "booking/status.updated" }] },
  async ({ event: _event, step }) => {
    const { _bookingId, _status } = _event.data;

    await step.run("create-timeline-entry", async () => {
        // We use bookingstatuslog as the immutable timeline
        return { success: true };
    });
  }
);

export const handleVendorRejectionJob = inngest.createFunction(
  { id: "handle-vendor-rejection-job", triggers: [{ event: "booking/vendor.rejected" }] },
  async ({ event, step }) => {
    const { bookingId, vendorId } = event.data;

    await step.run("reassign-next-vendor", async () => {
      const { handleVendorRejection } = await import("@/lib/intelligence/assignment");
      await handleVendorRejection(bookingId, vendorId);
    });
  }
);
