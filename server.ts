import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as ServerIO } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

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

  // Attach io to global so API routes can access it if needed
  (global as any).io = io;

  io.on("connection", (socket) => {
    console.log(`[Socket-IO] New connection: ${socket.id}`);

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
    console.log(`[Socket-IO] Server attached to raw HTTP upgrade events`);
  });

  httpServer.on("upgrade", (req, socket, head) => {
    if (req.url?.startsWith("/api/socket/io")) {
       // Socket.io handles this internally when initialized with httpServer
    }
  });
});
