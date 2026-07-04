import logger from "@/lib/logger";

export const emitSocketEvent = (userId: string, event: string, data: any) => {
  const io = (global as any).io;
  if (io) {
    // Emit to personal room
    io.to(`user:${userId}`).emit(event, data);

    // If it's a booking update, also emit to specific booking room if applicable
    if (data.bookingId) {
        io.to(`booking:${data.bookingId}`).emit(event, data);
    }

    logger.info(`[Socket] Emitted ${event} to user:${userId}`);
  } else {
    logger.warn("[Socket] IO instance not found on global object");
  }
};

export const broadcastToConversation = (conversationId: string, event: string, data: any) => {
    const io = (global as any).io;
    if (io) {
        io.to(`conversation:${conversationId}`).emit(event, data);
    }
};
