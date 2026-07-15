/**
 * Standardized Socket.IO Event Names
 * Used across client and server to ensure consistency.
 */
export const SOCKET_EVENTS = {
  // Notifications
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_UPDATED: "notification:updated",
  NOTIFICATION_DELETED: "notification:deleted",

  // Booking Lifecycle
  BOOKING_CREATED: "booking:created",
  BOOKING_ASSIGNED: "booking:assigned",
  BOOKING_ACCEPTED: "booking:accepted",
  BOOKING_NEGOTIATING: "booking:negotiating",
  BOOKING_CONFIRMED: "booking:confirmed",
  BOOKING_TRAVELING: "booking:traveling",
  BOOKING_ARRIVED: "booking:arrived",
  BOOKING_OTP: "booking:otp",
  BOOKING_STARTED: "booking:started",
  BOOKING_COMPLETED: "booking:completed",
  BOOKING_PAYMENT: "booking:payment",

  // Chat
  MESSAGE_NEW: "message:new",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",

  // Vendor Specific
  VENDOR_LOCATION_UPDATE: "vendor:location:update",
  VENDOR_UPDATED: "vendor:updated",

  // Room Management
  BOOKING_JOIN: "booking:join",
  BOOKING_LEAVE: "booking:leave",
  CONVERSATION_JOIN: "conversation:join",
  CONVERSATION_LEAVE: "conversation:leave",

  // Presence
  PRESENCE_UPDATE: "presence:update",
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
