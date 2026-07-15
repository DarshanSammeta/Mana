"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_http = require("http");
var import_url = require("url");
var import_next = __toESM(require("next"));
var import_socket = require("socket.io");
var dev = process.env.NODE_ENV !== "production";
var hostname = "localhost";
var port = parseInt(process.env.PORT || "3000", 10);
var app = (0, import_next.default)({ dev, hostname, port });
var handle = app.getRequestHandler();
app.prepare().then(() => {
  const httpServer = (0, import_http.createServer)((req, res) => {
    const parsedUrl = (0, import_url.parse)(req.url, true);
    handle(req, res, parsedUrl);
  });
  const io = new import_socket.Server(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ["polling", "websocket"],
    pingTimeout: 6e4,
    pingInterval: 25e3
  });
  global.io = io;
  io.on("connection", (socket) => {
    console.log(`[Socket-IO] New connection: ${socket.id}`);
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
    }
  });
});
