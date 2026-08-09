import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface SocketState {
  socket: Socket | null;
  token: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  onlineUsers: Set<string>;
  typingUsers: Record<string, Set<string>>; // conversationId -> Set of userIds
  offlineQueue: any[];
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  sendOfflineMessages: () => void;
  emitWithRetry: (event: string, data: any) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  token: null,
  isConnected: false,
  isConnecting: false,
  onlineUsers: new Set(),
  typingUsers: {},
  offlineQueue: [],

  connect: async (token: string) => {
    // 1. Validation & Guard Rails
    if (!token) {
      console.warn("[Socket] No token provided, skipping connection.");
      return;
    }

    if (get().isConnecting) return;

    // If already connected with same token, do nothing
    if (get().socket?.connected && get().token === token) {
      return;
    }

    // If connected with different token, disconnect first
    if (get().socket && get().token !== token) {
      get().disconnect();
    }

    set({ isConnecting: true, token });

    try {
      // 2. Initialize server-side socket if using API route fallback
      // In production with custom server, this is redundant but safe.
      // We append EIO=4 to avoid 400 errors from Socket.IO server expecting protocol version
      const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || "/api/socket/io";
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== "undefined" ? window.location.origin : "");

      await fetch(`${socketUrl}${socketPath}?EIO=4&transport=polling&t=${Date.now()}`).catch(() => {
        // Ignore fetch errors, let socket attempt connection
      });

      const socket = io(socketUrl, {
        auth: { token },
        path: socketPath,
        addTrailingSlash: false,
        reconnection: true,
        reconnectionAttempts: Infinity, // Production resilience
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        transports: ["websocket", "polling"], // Websocket first for stability
        upgrade: true,
        timeout: 20000,
        closeOnBeforeunload: true,
      });

      socket.on("connect_error", (err) => {
        const errorMessage = err.message.toLowerCase();

        if (errorMessage.includes("authentication") || errorMessage.includes("token")) {
          console.warn("[Socket] Authentication failed. Disconnecting silently.");
          get().disconnect();
          return;
        }

        if (errorMessage.includes("websocket error") || errorMessage.includes("xhr poll error")) {
          // Classified as transport error
          if (!get().isConnected) {
             // Only log if we haven't successfully connected before to avoid spam
             // Or use a throttled logger
          }
        } else if (errorMessage.includes("timeout")) {
          console.warn("[Socket] Connection timeout");
        } else if (
          errorMessage.includes("websocket error") ||
          errorMessage.includes("xhr poll error") ||
          errorMessage.includes("transport")
        ) {
          // Temporary network/server unavailable.
          // Socket.IO will automatically reconnect.
        } else {
          console.warn("[Socket]", err.message);
        }

        set({ isConnecting: false });
      });

      socket.on("connect", () => {
        console.log("[Socket] Connected successfully via", socket.io.engine.transport.name);
        set({ isConnected: true, isConnecting: false });
        get().sendOfflineMessages();

        socket.io.engine.on("upgrade", (transport) => {
          console.log("[Socket] Transport upgraded to:", transport.name);
        });
      });

      socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
        set({ isConnected: false, isConnecting: false });

        if (reason === "io server disconnect") {
          // The server has forcefully disconnected the socket, need to manually reconnect
          socket.connect();
        }
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
    } catch (err) {
      console.error("[Socket] Initialization failed:", err);
      set({ isConnecting: false });
    }
  },

  emitWithRetry: (event: string, data: any) => {
    const { socket, isConnected } = get();
    if (socket && isConnected) {
      socket.emit(event, data, (response: any) => {
        if (response?.error) {
          console.error(`[Socket] Emit error for ${event}:`, response.error);
        }
      });
    } else {
      console.log(`[Socket] Offline. Queuing event: ${event}`);
      set((state) => ({
        offlineQueue: [...state.offlineQueue, { event, data, timestamp: Date.now() }]
      }));
    }
  },

  sendOfflineMessages: () => {
    const { socket, offlineQueue } = get();
    if (!socket || !socket.connected || offlineQueue.length === 0) return;

    console.log(`[Socket] Flushing ${offlineQueue.length} offline events`);

    // Sort by timestamp to ensure order
    const sortedQueue = [...offlineQueue].sort((a, b) => a.timestamp - b.timestamp);

    sortedQueue.forEach(({ event, data }) => {
      socket.emit(event, data);
    });

    set({ offlineQueue: [] });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    set({ socket: null, token: null, isConnected: false, isConnecting: false });
  },
}));
