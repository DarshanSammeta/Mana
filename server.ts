import "dotenv/config";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import { Server as ServerIO } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const skipNextApp = process.env.SKIP_NEXT_APP === "true";

// Initialize Next.js only if not in sidecar-only mode
const app = !skipNextApp ? next({ dev, hostname, port }) : null;
const handle = app?.getRequestHandler();

const startServer = async () => {
  if (app) {
    await app.prepare();
  }

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // 1. HEALTH CHECKS (Must work in both Vercel and Sidecar)
    if (req.url === "/health" || req.url === "/live" || req.url === "/api/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      return res.end("OK");
    }

    if (req.url === "/ready") {
      try {
        const { prisma } = await import("./src/lib/prisma");
        const { ping } = await import("./src/lib/redis");

        // Timeout check to prevent pod death during spikes
        const check = Promise.all([
          prisma.$queryRaw`SELECT 1`,
          ping()
        ]);

        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), 3000));

        await Promise.race([check, timeout]);
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end("READY");
      } catch (e) {
        res.writeHead(503, { "Content-Type": "text/plain" });
        return res.end("UNREADY");
      }
    }

    // 2. Next.js Request Handling
    if (handle) {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("ManaEvents Sidecar: Next.js is disabled on this instance.");
    }
  });

  // 3. Socket.IO Implementation (Preserved Business Logic)
  const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map(o => o.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    allowedOrigins.push(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    );
  }

  const socketPath = process.env.SOCKET_PATH || process.env.NEXT_PUBLIC_SOCKET_PATH || "/api/socket/io";

  const io = new ServerIO(httpServer, {
    path: socketPath,
    addTrailingSlash: false,
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(o => o.startsWith(origin) || origin.startsWith(o))) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error("Unauthorized"));
      const { verifyAccessToken } = await import("./src/lib/auth/token-logic");
      const payload = await verifyAccessToken(token);
      if (!payload) return next(new Error("Invalid token"));
      (socket as any).userId = payload.userId;
      (socket as any).userRole = payload.role;
      next();
    } catch (err) {
      next(new Error("Auth Error"));
    }
  });

  (global as any).io = io;

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    socket.join(`user:${userId}`);
    if ((socket as any).userRole === "ADMIN") socket.join("admin:all");

    // Log connection for sidecar monitoring
    if (skipNextApp) {
      console.log(`[Sidecar] User ${userId} connected to room: user:${userId}`);
    }
  });

  httpServer.listen(port, () => {
    console.log(`> ManaEvents ${skipNextApp ? "Sidecar" : "Server"} running on port ${port}`);
    if (skipNextApp) {
      console.log(`> Mode: Socket.IO & Health Only`);
      console.log(`> Path: ${socketPath}`);
    }
  });

  const shutdown = () => {
    console.log("Shutting down gracefully...");
    httpServer.close(async () => {
      const { prisma } = await import("./src/lib/prisma");
      await prisma.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 20000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
