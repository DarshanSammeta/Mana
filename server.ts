import "dotenv/config";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as ServerIO } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

console.log('[Server] Initializing...');
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log('[Server] Preparing app...');
app.prepare().then(() => {
  console.log('[Server] App prepared. Creating HTTP server...');
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // TODO: Implement Redis Adapter for Socket.IO when horizontal scaling is required.
  // This will allow event broadcasting across multiple server instances.
  // const { createAdapter } = await import("@socket.io/redis-adapter");
  // const { getIoRedis } = await import("./src/lib/redis");
  // io.adapter(createAdapter(getIoRedis(), getIoRedis().duplicate()));

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter(Boolean) as string[];

  const io = new ServerIO(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(o => o.startsWith(origin) || origin.startsWith(o))) {
          callback(null, true);
        } else {
          console.warn(`[Socket-IO] Blocked connection from unauthorized origin: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // PRIORITY 5: Socket.IO Security Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        console.warn("[Socket-IO Auth] Connection rejected: Token missing");
        return next(new Error("Authentication error: Token missing"));
      }

      // We need a way to verify the token in server.ts
      // Since server.ts is compiled separately, we must ensure it can access the secret.
      const { verifyAccessToken } = await import("./src/lib/auth-core");
      const payload = await verifyAccessToken(token);

      if (!payload) {
        console.error("[Socket-IO Auth] Connection rejected: Invalid token or verification failed");
        return next(new Error("Authentication error: Invalid token"));
      }

      // Attach user info to socket
      (socket as any).userId = payload.userId;
      (socket as any).userRole = payload.role;

      console.log(`[Socket-IO Auth] Success for user: ${payload.userId}`);
      next();
    } catch (err: any) {
      console.error("[Socket-IO Auth] Internal Error:", err.message);
      next(new Error("Authentication internal error"));
    }
  });

  // Attach io to global so API routes can access it if needed
  (global as any).io = io;

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    console.log(`[Socket-IO] Authenticated connection: ${socket.id} (User: ${userId})`);

    // Secure Room Joins
    socket.join(`user:${userId}`);
    if ((socket as any).userRole === "ADMIN") {
        socket.join("admin:all");
    }

    // Minimal connection logic for verification
    socket.on("ping", (cb) => {
      if (typeof cb === "function") cb("pong");
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket-IO] Socket ${socket.id} disconnected: ${reason}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] JWT Secret present: ${!!process.env.JWT_ACCESS_SECRET}`);
    console.log(`[Socket-IO] Server attached to raw HTTP upgrade events`);
  });

  // Global error handling for the HTTP server to catch ECONNRESET and other common errors
  httpServer.on("error", (err: any) => {
    if (err.code === "ECONNRESET") {
      console.warn("[Server] ECONNRESET detected (client closed connection abruptly). Ignoring.");
    } else {
      console.error("[Server] Critical Error:", err);
    }
  });

  httpServer.on("upgrade", (req, socket, head) => {
    if (req.url?.startsWith("/api/socket/io")) {
       // Socket.io handles this internally when initialized with httpServer
    }
  });
});
