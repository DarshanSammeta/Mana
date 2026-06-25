import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIo } from "@/types/socket";
import { verifyAccessToken } from "@/lib/auth";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    });

    // Make io accessible globally for webhook triggers
    (global as any).io = io;

    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const payload = verifyAccessToken(token);
      if (!payload) return next(new Error("Authentication error"));

      (socket as any).userId = payload.userId;
      (socket as any).role = payload.role;
      next();
    });

    io.on("connection", (socket) => {
      const userId = (socket as any).userId;

      // Join personal room
      socket.join(`user:${userId}`);
      console.log(`User connected: ${userId}`);

      socket.on("conversation:join", (conversationId) => {
        socket.join(`conversation:${conversationId}`);
      });

      socket.on("booking:join", (bookingId) => {
        socket.join(`booking:${bookingId}`);
      });

      socket.on("message:send", (message) => {
        socket.to(`conversation:${message.conversationId}`).emit("message:receive", message);
      });

      // Intelligence Engine: Real-time location updates
      socket.on("location:update", ({ lat, lng }) => {
        // Broadcast to relevant booking rooms if this is an assigned vendor
        const role = (socket as any).role;
        if (role === 'VENDOR') {
          io.emit("vendor:location", { vendorId: userId, lat, lng });
        }
      });

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${userId}`);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;
