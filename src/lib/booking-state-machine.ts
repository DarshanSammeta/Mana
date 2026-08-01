import { booking_status } from "@prisma/client";

/**
 * Enterprise Booking State Machine
 * Enforces a strict, server-side validated lifecycle for all bookings.
 */
export const VALID_TRANSITIONS: Record<booking_status, booking_status[]> = {
  // Initial Steps
  DRAFT: ["PENDING_VENDOR_RESPONSE", "CANCELLED"],
  PENDING_VENDOR_RESPONSE: ["COUNTERED", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],

  // Negotiation
  COUNTERED: ["ACCEPTED", "COUNTER_REJECTED", "COUNTERED", "CANCELLED"],
  COUNTER_REJECTED: ["COUNTERED", "CANCELLED"],

  // Confirmation & Payment
  ACCEPTED: ["ADVANCE_PAYMENT_PENDING", "CANCELLED"],
  ADVANCE_PAYMENT_PENDING: ["CONFIRMED", "PAYMENT_EXPIRED", "CANCELLED"],

  // Operational Lifecycle
  CONFIRMED: ["PREPARATION_STARTED", "IN_PROGRESS", "CANCELLED"],
  PREPARATION_STARTED: ["VENDOR_ASSIGNED", "CANCELLED"],
  VENDOR_ASSIGNED: ["VENDOR_EN_ROUTE", "CANCELLED"],
  VENDOR_EN_ROUTE: ["VENDOR_ARRIVED", "CANCELLED"],
  VENDOR_ARRIVED: ["EVENT_STARTED", "CANCELLED"],

  // Event Execution
  EVENT_STARTED: ["EVENT_ONGOING", "EVENT_COMPLETED", "EMERGENCY"],
  EVENT_ONGOING: ["EVENT_COMPLETED", "EMERGENCY"],
  IN_PROGRESS: ["EVENT_COMPLETED", "EMERGENCY"],
  EVENT_COMPLETED: ["CUSTOMER_CONFIRMED", "BALANCE_PENDING", "CLOSED"],
  EMERGENCY: ["EVENT_COMPLETED", "CLOSED"],

  // Post-Event & Closing
  CUSTOMER_CONFIRMED: ["CLOSED"],
  BALANCE_PENDING: ["CLOSED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],

  // Error & Exception States
  REJECTED: ["CLOSED"],
  CANCELLED: ["REFUND_PENDING", "CLOSED"],
  EXPIRED: ["CLOSED"],
  PAYMENT_EXPIRED: ["CLOSED"],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: ["CLOSED"],

  // Legacy support (to avoid breaking current records during migration)
  SEARCHING: ["PENDING_VENDOR_RESPONSE", "CANCELLED"],
  VENDORS_NOTIFIED: ["PENDING_VENDOR_RESPONSE", "CANCELLED"],
  QUOTE_RECEIVED: ["PENDING_VENDOR_RESPONSE", "CANCELLED"],
  NEGOTIATING: ["COUNTERED", "ACCEPTED", "CANCELLED"],
  QUOTE_ACCEPTED: ["ACCEPTED", "CANCELLED"],
  PENDING_ADVANCE: ["ADVANCE_PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["ADVANCE_PAYMENT_PENDING", "CANCELLED"],
  ADVANCE_PAID: ["CONFIRMED", "CANCELLED"],
  VENDOR_REVIEW: ["CONFIRMED", "REJECTED", "CANCELLED"],
  PREPARATION: ["PREPARATION_STARTED", "CANCELLED"],
  VENDOR_TRAVELING: ["VENDOR_EN_ROUTE", "CANCELLED"],
  OTP_VERIFICATION_PENDING: ["EVENT_STARTED", "CANCELLED"],
  DISPUTED: ["CLOSED"],
  FULLY_PAID: ["CLOSED"],
  PAYMENT_RELEASED: ["CLOSED"]
} as unknown as Record<booking_status, any>;

/**
 * Validates if a transition from currentStatus to nextStatus is allowed.
 */
export function isValidTransition(currentStatus: booking_status, nextStatus: booking_status): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(nextStatus);
}
