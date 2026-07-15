import logger from "@/lib/logger";

/**
 * Standardized helper for server-side socket emission.
 * Logic is centralized to ensure rooms are respected and events are consistent.
 */
export const emitSocketEvent = (userId: string, event: string, data: any) => {
  const io = (global as any).io;
  if (!io) {
    logger.warn("[Socket] IO instance not found on global object");
    return;
  }

  // 1. Emit to user's personal room (for notifications, etc.)
  io.to(`user:${userId}`).emit(event, data);

  // 2. If it's a booking-related event, emit to the specific booking room
  const bookingId = data.bookingId || (data.metadata && data.metadata.bookingId);
  if (bookingId) {
    io.to(`booking:${bookingId}`).emit(event, data);
  }

  logger.info(`[Socket] Emitted ${event} to user:${userId}${bookingId ? ` and booking:${bookingId}` : ""}`);
};

/**
 * Broadcasts an event to a specific conversation room.
 */
export const broadcastToConversation = (conversationId: string, event: string, data: any) => {
  const io = (global as any).io;
  if (!io) {
    logger.warn("[Socket] IO instance not found on global object");
    return;
  }

  io.to(`conversation:${conversationId}`).emit(event, data);
  logger.info(`[Socket] Broadcasted ${event} to conversation:${conversationId}`);
};

export const socketHelper = {
  emit: emitSocketEvent,
  broadcastToConversation,
};
