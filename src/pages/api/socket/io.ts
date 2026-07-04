import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIo } from "@/types/socket";
import { verifyAccessToken } from "@/lib/auth";
import { observability } from "@/lib/observability";
import logger from "@/lib/logger";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (res.socket.server.io) {
    console.log("[Socket-IO] Socket is already running");
    res.end();
    return;
  }

  console.log("[Socket-IO] Initializing Socket.io server...");
  const httpServer: NetServer = res.socket.server as any;
  const io = new ServerIO(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"],
    // Increase timeouts for dev environment stability
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Make io accessible globally for webhook triggers
  (global as any).io = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.error("[Socket-IO] Auth failed: No token provided");
      return next(new Error("Authentication error"));
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      logger.error("[Socket-IO] Auth failed: Invalid token");
      return next(new Error("Authentication error"));
    }

    (socket as any).userId = payload.userId;
    (socket as any).role = payload.role;
    next();
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    console.log(`[Socket-IO] User connected: ${userId} (${socket.id})`);
    observability.incrementConnections();

    // Join personal room for private notifications/updates
    socket.join(`user:${userId}`);

    // Presence tracking
    socket.broadcast.emit("presence:update", { userId, status: "online" });

    socket.on("conversation:join", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit("presence:read", { userId, conversationId });
    });

    socket.on("conversation:leave", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("typing:start", (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit("typing:update", { userId, conversationId, isTyping: true });
    });

    socket.on("typing:stop", (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit("typing:update", { userId, conversationId, isTyping: false });
    });

    socket.on("message:send", async (message, callback) => {
      socket.to(`conversation:${message.conversationId}`).emit("message:receive", message);
      if (callback) callback({ status: "ok", id: message.id });
    });

    socket.on("message:read", ({ messageId, conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("message:status", {
        messageId,
        status: "read",
        userId
      });
    });

    socket.on("location:update", ({ lat, lng }) => {
      const role = (socket as any).role;
      if (role === 'VENDOR') {
        io.emit("vendor:location", { vendorId: userId, lat, lng });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket-IO] User disconnected: ${userId} (${reason})`);
      observability.decrementConnections();
      socket.broadcast.emit("presence:update", { userId, status: "offline", lastSeen: new Date() });
    });
  });

  res.socket.server.io = io;
  res.end();
};

export default ioHandler;
