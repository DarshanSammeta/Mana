import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("OperationsService can only be used on the server.");
}
import { safeRedis } from "@/lib/redis";
import { Inngest } from "inngest";
import { Decimal } from "@prisma/client/runtime/library";
import { emitSocketEvent } from "@/lib/socket-helper";
import { SOCKET_EVENTS } from "@/constants/socket-events";
import { FinanceService } from "./finance.service";

const inngest = new Inngest({ id: "mana-operations" });

export class OperationsService {
  // --- Support Center ---

  static async createTicket(userId: string, data: {
    category: string;
    subject: string;
    description: string;
    priority?: string;
    metadata?: any;
  }) {
    const prisma = getPrisma();
    const ticket = await prisma.support_ticket.create({
      data: {
        userId,
        ...data,
        status: "OPEN",
        slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h SLA default
      },
    });

    await inngest.send({
      name: "ops/ticket.created",
      data: { ticketId: ticket.id, userId },
    });

    emitSocketEvent(userId, "ticket:created", ticket);

    return ticket;
  }

  static async addTicketMessage(ticketId: string, senderId: string, content: string, isInternal = false) {
    const prisma = getPrisma();
    const message = await prisma.support_ticket_message.create({
      data: {
        ticketId,
        senderId,
        content,
        isInternal,
      },
      include: { ticket: true }
    });

    if (!isInternal) {
      emitSocketEvent(message.ticket.userId, "ticket:message", message);
    }

    return message;
  }

  // --- Cancellation & Refund Engine ---

  static async cancelBooking(bookingId: string, cancelledBy: string, reason: string) {
    const prisma = getPrisma();
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { user: true, vendorprofile: true },
      });

      if (!booking) throw new Error("Booking not found");

      // Calculate Penalties (Business Logic)
      let penalty = new Decimal(0);
      let refundAmount = booking.totalAmount;

      // Example: 20% penalty if cancelled within 48h
      const hoursUntilEvent = (booking.eventDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilEvent < 48) {
        penalty = booking.totalAmount.mul(0.2);
        refundAmount = booking.totalAmount.sub(penalty);
      }

      const cancellation = await tx.cancellation_record.create({
        data: {
          bookingId,
          cancelledBy,
          role: "CUSTOMER", // Should be dynamic
          reason,
          penaltyAmount: penalty,
          refundAmount: refundAmount,
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });

      // Integrated Wallet Refund Logic
      if (refundAmount.gt(0)) {
        await FinanceService.transferFunds(
          "ESCROW", // Usually funds are in escrow until completion
          "USER",   // Transfer back to customer wallet
          refundAmount,
          {
            description: `Refund for cancelled booking #${booking.id}`,
            reference: cancellation.id
          }
        );
      }

      emitSocketEvent(booking.customerId, SOCKET_EVENTS.BOOKING_NEGOTIATING, { bookingId, status: "CANCELLED" });
      if (booking.vendorprofile) {
        emitSocketEvent(booking.vendorprofile.userId, SOCKET_EVENTS.BOOKING_NEGOTIATING, { bookingId, status: "CANCELLED" });
      }

      return cancellation;
    });
  }

  // --- Trust & Quality Engine ---

  static async updateTrustScore(targetId: string, type: "VENDOR" | "CUSTOMER") {
    const prisma = getPrisma();
    const stats = await prisma.$transaction(async (tx) => {
      if (type === "VENDOR") {
        const vendor = await tx.vendorprofile.findUnique({
          where: { id: targetId },
          include: {
            booking: { where: { status: "EVENT_COMPLETED" } },
            review: true
          }
        });

        if (!vendor) return;

        // Trust Score Components:
        // 1. Completion Rate (0-40)
        const completionScore = vendor.completionRate * 0.4;
        // 2. Rating (0-40)
        const ratingScore = vendor.rating * 8;
        // 3. Verification status (0-20)
        const verificationScore = vendor.verificationStatus === "APPROVED" ? 20 : 0;

        const totalScore = completionScore + ratingScore + verificationScore;

        return await tx.quality_metrics.upsert({
          where: { targetId },
          update: { trustScore: totalScore, lastCalculated: new Date() },
          create: { targetId, targetType: "VENDOR", trustScore: totalScore }
        });
      }
    });

    return stats;
  }

  // --- Fraud Detection ---

  static async checkVelocity(userId: string, action: string) {
    const prisma = getPrisma();
    const key = `velocity:${userId}:${action}`;
    const count = await safeRedis.incr(key) as number;

    if (count === 1) {
      await safeRedis.expire(key, 3600); // 1 hour window
    }

    if (count > 10) { // Max 10 per hour
      await prisma.fraud_detection_log.create({
        data: {
          userId,
          type: "VELOCITY_LIMIT_EXCEEDED",
          severity: "MEDIUM",
          description: `User exceeded velocity limit for ${action}`,
          evidence: { count }
        }
      });
      return false;
    }
    return true;
  }

  // --- Dispute Management ---

  static async raiseDispute(bookingId: string, raisedBy: string, data: {
    reason: string;
    description: string;
    evidence?: any;
  }) {
    const prisma = getPrisma();
    const dispute = await prisma.dispute.create({
      data: {
        id: `DISP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        bookingId,
        raisedBy,
        reason: data.reason,
        description: data.description,
        evidence: data.evidence,
        status: "OPEN",
        updatedAt: new Date(),
      },
      include: { booking: { include: { vendorprofile: true } } }
    });

    emitSocketEvent(dispute.booking.customerId, "dispute:raised", dispute);
    if (dispute.booking.vendorprofile) {
      emitSocketEvent(dispute.booking.vendorprofile.userId, "dispute:raised", dispute);
    }

    return dispute;
  }

  static async resolveDispute(disputeId: string, resolution: string, status: "RESOLVED" | "CLOSED") {
    const prisma = getPrisma();
    return await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        resolution,
        status,
        updatedAt: new Date(),
      },
    });
  }

  // --- Document Management ---

  static async updateDocumentStatus(documentId: string, status: "APPROVED" | "REJECTED") {
    const prisma = getPrisma();
    const doc = await prisma.vendordocument.update({
      where: { id: documentId },
      data: { status },
    });

    // If all required documents are approved, update vendor verification status
    if (status === "APPROVED") {
      const pendingDocs = await prisma.vendordocument.count({
        where: { vendorProfileId: doc.vendorProfileId, status: "PENDING" },
      });

      if (pendingDocs === 0) {
        await prisma.vendorprofile.update({
          where: { id: doc.vendorProfileId },
          data: { verificationStatus: "APPROVED" },
        });
      }
    }

    return doc;
  }
}
