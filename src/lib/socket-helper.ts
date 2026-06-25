import { Server as ServerIO } from "socket.io";

export const emitSocketEvent = (userId: string, event: string, data: any) => {
  // This is a placeholder for the global IO instance.
  // In a real Next.js environment with the custom server/pages router socket setup,
  // we usually access the IO instance from the global object or via a separate service.

  const io = (global as any).io;
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    console.log(`Emitted ${event} to user:${userId}`);
  } else {
    console.warn("Socket.IO instance not found on global object");
  }
};
