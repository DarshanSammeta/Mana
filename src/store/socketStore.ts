import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Record<string, Set<string>>; // conversationId -> Set of userIds
  offlineQueue: any[];
  connect: (token: string) => void;
  disconnect: () => void;
  sendOfflineMessages: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: {},
  offlineQueue: [],

  connect: (token: string) => {
    if (!token) {
      console.warn("Socket: No token provided, skipping connection");
      return;
    }

    // Initialize the socket server by making a fetch request
    fetch("/api/socket/io").then(res => {
      console.log("[Socket] Warm-up fetch status:", res.status);
    }).catch(err => {
      console.error("[Socket] Warm-up fetch failed:", err);
    });

    const socket = io({
      auth: { token },
      path: "/api/socket/io",
      addTrailingSlash: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["polling"], // Start ONLY with polling to ensure stable handshake
      upgrade: true,           // Allow upgrade to websocket
      timeout: 30000,
      forceNew: true,
    });

    socket.on("connect_error", (err) => {
      console.error("Socket Connection Error Type:", err.name);
      console.error("Socket Connection Error Message:", err.message);
      // Log the full error for deep debugging if it's a websocket error
      if (err.message === "websocket error") {
        console.dir(err);
      }
      if (err.message === "Authentication error" || err.message === "Invalid token") {
        get().disconnect();
      }
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      set({ isConnected: true });
      get().sendOfflineMessages();
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      set({ isConnected: false });
    });

    socket.on("presence:update", ({ userId, status }) => {
      set((state) => {
        const newOnline = new Set(state.onlineUsers);
        if (status === "online") newOnline.add(userId);
        else newOnline.delete(userId);
        return { onlineUsers: newOnline };
      });
    });

    socket.on("typing:update", ({ userId, conversationId, isTyping }) => {
      set((state) => {
        const conversationTyping = new Set(state.typingUsers[conversationId] || []);
        if (isTyping) conversationTyping.add(userId);
        else conversationTyping.delete(userId);
        return {
          typingUsers: { ...state.typingUsers, [conversationId]: conversationTyping }
        };
      });
    });

    set({ socket });
  },

  sendOfflineMessages: () => {
    const { socket, offlineQueue } = get();
    if (!socket || !socket.connected || offlineQueue.length === 0) return;

    offlineQueue.forEach((msg) => {
      socket.emit("message:send", msg);
    });
    set({ offlineQueue: [] });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false });
  },
}));
