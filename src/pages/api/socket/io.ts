import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIo } from "@/types/socket";
import { verifyAccessToken } from "@/lib/jwt";
import { observability } from "@/lib/observability";
import logger from "@/lib/logger";
import { prisma } from "@/lib/prisma-pages";
import { SOCKET_EVENTS } from "@/constants/socket-events";
import { rateLimit } from "@/lib/rate-limit-pages";
import { safeRedis } from "@/lib/redis";

console.log("[Socket-IO] Module loaded");

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  try {
    if (!res.socket) {
      console.error("[Socket-IO] No socket found on response");
      res.status(500).json({ error: "No socket found" });
      return;
    }

    if (res.socket.server.io) {
      console.log("[Socket-IO] Socket.IO server already running");
      res.end();
      return;
    }

    console.log("[Socket-IO] Initializing Socket.IO server...");
    const httpServer: NetServer = res.socket.server as any;

    if (!httpServer) {
        console.error("[Socket-IO] No HTTP server found on socket");
        res.status(500).json({ error: "No HTTP server found" });
        return;
    }

    const io = new ServerIO(httpServer, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["polling", "websocket"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

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
    const role = (socket as any).role;

    observability.incrementConnections();
    socket.join(`user:${userId}`);
    socket.broadcast.emit(SOCKET_EVENTS.PRESENCE_UPDATE, { userId, status: "online" });

    // Rate limiting helper
    const checkRateLimit = async (type: string, limit: number, window: number) => {
      const result = await rateLimit(`socket:${userId}:${type}`, { limit, window });
      return result.success;
    };

    // --- Booking Room Management ---
    socket.on(SOCKET_EVENTS.BOOKING_JOIN, async (bookingId) => {
      try {
        if (!bookingId) return;
        if (role === 'ADMIN') {
          socket.join(`booking:${bookingId}`);
          return;
        }

        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { bookingassignment: { where: { vendorId: userId } } }
        });

        if (!booking) return;

        const isAuthorized =
          booking.customerId === userId ||
          booking.vendorId === userId ||
          booking.bookingassignment.length > 0;

        if (isAuthorized) {
          socket.join(`booking:${bookingId}`);
        }
      } catch (error) {
        logger.error("[Socket-IO] Error in booking:join", error);
      }
    });

    socket.on(SOCKET_EVENTS.BOOKING_LEAVE, (bookingId) => {
      socket.leave(`booking:${bookingId}`);
    });

    // --- Conversation Room Management ---
    socket.on(SOCKET_EVENTS.CONVERSATION_JOIN, async (conversationId) => {
      try {
        if (!conversationId) return;
        const participant = await prisma.conversationparticipant.findUnique({
          where: {
            conversationId_userId: { conversationId, userId }
          }
        });

        if (participant || role === 'ADMIN') {
          socket.join(`conversation:${conversationId}`);
          socket.to(`conversation:${conversationId}`).emit("presence:read", { userId, conversationId });
        }
      } catch (error) {
        logger.error("[Socket-IO] Error in conversation:join", error);
      }
    });

    socket.on(SOCKET_EVENTS.CONVERSATION_LEAVE, (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // --- Chat Events ---
    socket.on(SOCKET_EVENTS.TYPING_START, (conversationId) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("typing:update", { userId, conversationId, isTyping: true });
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, (conversationId) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("typing:update", { userId, conversationId, isTyping: false });
    });

    socket.on("message:send", async (message, callback) => {
      if (!message?.conversationId || message.senderId !== userId) {
        if (callback) callback({ error: "Unauthorized or invalid payload" });
        return;
      }

      // Rate limit messages: 5 messages per 2 seconds
      if (!(await checkRateLimit("message", 5, 2))) {
        if (callback) callback({ error: "Rate limit exceeded" });
        return;
      }

      socket.to(`conversation:${message.conversationId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, message);
      if (callback) callback({ status: "ok", id: message.id });
    });

    // --- Location Optimization ---
    socket.on(SOCKET_EVENTS.VENDOR_LOCATION_UPDATE, async ({ bookingId, lat, lng }) => {
      if (role !== 'VENDOR' || !bookingId) return;

      const now = Date.now();
      const throttleKey = `throttle:location:${userId}`;

      // Redis-backed throttling (10s)
      const lastUpdate = await safeRedis.get<number>(throttleKey);
      if (lastUpdate && now - Number(lastUpdate) < 10000) return;

      await safeRedis.set(throttleKey, now, 10); // Expire after 10s

      // Broadcast to specific booking room (Customer and Admin)
      io.to(`booking:${bookingId}`).emit(SOCKET_EVENTS.VENDOR_LOCATION_UPDATE, {
        vendorId: userId,
        lat,
        lng,
        bookingId,
        timestamp: now
      });

      // Log to Redis for real-time tracking dashboard
      await safeRedis.set(`vendor:location:${userId}`, { lat, lng, bookingId, updatedAt: now }, 60);
    });

    socket.on("disconnect", (_reason) => {
      observability.decrementConnections();
      socket.broadcast.emit(SOCKET_EVENTS.PRESENCE_UPDATE, { userId, status: "offline", lastSeen: new Date() });
    });
  });

  res.socket.server.io = io;
  res.end();
  } catch (error) {
    logger.error("[Socket-IO] Critical failure in ioHandler", error);
    res.status(500).json({ error: "Socket.IO initialization failed" });
  }
};

export default ioHandler;
