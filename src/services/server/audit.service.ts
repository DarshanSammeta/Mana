import { getPrisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { user_role, Prisma } from "@prisma/client";
import logger from "@/lib/logger";

export interface AuditLogOptions {
  entityType: string;
  entityId: string;
  module: string;
  action: string;
  performedByUserId?: string;
  performedByRole?: user_role | string;
  performedByName?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  bookingId?: string;
  vendorId?: string;
  customerProfileId?: string;
  ipAddress?: string;
  // Context to avoid async headers() calls inside transactions
  context?: {
    requestId?: string | null;
    correlationId?: string | null;
    ipAddress?: string | null;
    device?: string | null;
    browser?: string | null;
    os?: string | null;
  };
}

export class AuditService {
  /**
   * Resolves request context once per request.
   */
  static async resolveContext() {
    try {
      const headerList = await headers();
      const userAgent = headerList.get("user-agent") || "";
      let os = "unknown";
      let browser = "unknown";

      if (userAgent.includes("Windows")) os = "Windows";
      else if (userAgent.includes("Mac OS")) os = "MacOS";
      else if (userAgent.includes("Android")) os = "Android";
      else if (userAgent.includes("iPhone")) os = "iOS";

      if (userAgent.includes("Chrome")) browser = "Chrome";
      else if (userAgent.includes("Firefox")) browser = "Firefox";
      else if (userAgent.includes("Safari")) browser = "Safari";

      return {
        requestId: headerList.get("x-request-id"),
        correlationId: headerList.get("x-correlation-id") || headerList.get("x-request-id"),
        ipAddress: headerList.get("x-forwarded-for")?.split(",")[0] || "unknown",
        device: headerList.get("sec-ch-ua-platform") || "unknown",
        browser,
        os
      };
    } catch {
      return null;
    }
  }

  /**
   * Core logging method.
   */
  static async log(options: AuditLogOptions, tx?: Prisma.TransactionClient) {
    const start = performance.now();
    const db = tx || getPrisma();

    let context = options.context;

    // Only attempt to resolve if not provided and not in a transaction that might be sensitive to async context
    if (!context && !tx) {
        context = await this.resolveContext() || undefined;
    }

    try {
      const logEntry = await db.audit_log.create({
        data: {
          entityType: options.entityType,
          entityId: options.entityId,
          module: options.module,
          action: options.action,
          performedByUserId: options.performedByUserId,
          performedByRole: options.performedByRole,
          performedByName: options.performedByName,
          oldValue: options.oldValue ? JSON.parse(JSON.stringify(options.oldValue)) : undefined,
          newValue: options.newValue ? JSON.parse(JSON.stringify(options.newValue)) : undefined,
          metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : undefined,
          bookingId: options.bookingId,
          vendorId: options.vendorId,
          customerProfileId: options.customerProfileId,
          requestId: context?.requestId,
          correlationId: context?.correlationId,
          ipAddress: context?.ipAddress || options.ipAddress,
          device: context?.device,
          browser: context?.browser,
          operatingSystem: context?.os,
        }
      });

      console.log(`[AuditService] Log created for ${options.action} in ${(performance.now() - start).toFixed(2)}ms`);
      return logEntry;
    } catch (error: any) {
      logger.error("Failed to create audit log entry", { error: error.message, options });
    }
  }

  /**
   * Specialized helper for Booking actions.
   */
  static async logBooking(
    bookingId: string,
    action: string,
    performer: any,
    changes?: { old?: any, new?: any },
    metadata?: any,
    tx?: Prisma.TransactionClient
  ) {
    return this.log({
      entityType: "BOOKING",
      entityId: bookingId,
      bookingId: bookingId,
      module: "BOOKING_OPERATIONS",
      action,
      performedByUserId: performer.id,
      performedByRole: performer.role,
      performedByName: performer.name,
      oldValue: changes?.old,
      newValue: changes?.new,
      metadata
    }, tx);
  }

  /**
   * Specialized helper for Payment actions.
   */
  static async logPayment(
    paymentId: string,
    bookingId: string,
    action: string,
    performer: any,
    details?: any,
    tx?: Prisma.TransactionClient
  ) {
    return this.log({
      entityType: "PAYMENT",
      entityId: paymentId,
      bookingId: bookingId,
      module: "FINANCE",
      action,
      performedByUserId: performer.id,
      performedByRole: performer.role,
      performedByName: performer.name,
      newValue: details
    }, tx);
  }

  /**
   * Specialized helper for Auth actions.
   */
  static async logAuth(
    userId: string,
    action: string,
    role: string,
    name: string,
    tx?: Prisma.TransactionClient
  ) {
    return this.log({
      entityType: "USER",
      entityId: userId,
      module: "AUTH",
      action,
      performedByUserId: userId,
      performedByRole: role,
      performedByName: name
    }, tx);
  }

  /**
   * Specialized helper for Order actions.
   */
  static async logOrder(
    orderId: string,
    action: string,
    performer: any,
    details?: any,
    tx?: Prisma.TransactionClient
  ) {
    return this.log({
      entityType: "ORDER",
      entityId: orderId,
      module: "ORDER_MANAGEMENT",
      action,
      performedByUserId: performer.id,
      performedByRole: performer.role,
      performedByName: performer.name,
      newValue: details
    }, tx);
  }

  /**
   * Specialized helper for Vendor management actions.
   */
  static async logVendorAction(
    vendorId: string,
    action: string,
    performer: any,
    details?: any,
    tx?: Prisma.TransactionClient
  ) {
    return this.log({
      entityType: "VENDOR",
      entityId: vendorId,
      vendorId,
      module: "VENDOR_MANAGEMENT",
      action,
      performedByUserId: performer.id,
      performedByRole: performer.role,
      performedByName: performer.name,
      newValue: details
    }, tx);
  }
}
