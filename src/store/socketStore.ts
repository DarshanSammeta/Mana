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
    // If already connecting or connected with SAME token, skip
    if (!token || get().isConnecting || (get().socket && get().token === token)) {
      return;
    }

    // If connected with DIFFERENT token, disconnect first
    if (get().socket && get().token !== token) {
      get().disconnect();
    }

    set({ isConnecting: true, token });

    try {
      // Ensure the socket server is initialized
      await fetch(`/api/socket/io?t=${Date.now()}`);

      const socket = io(window.location.origin, {
        auth: { token },
        path: "/api/socket/io",
        addTrailingSlash: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        transports: ["websocket", "polling"],
        upgrade: true,
        timeout: 20000,
        closeOnBeforeunload: true,
      });

      socket.on("connect_error", (err) => {
        console.error("[Socket] Connection Error:", err.message);
        set({ isConnecting: false });
        if (err.message === "Authentication error" || err.message === "Invalid token") {
          get().disconnect();
        }
      });

      socket.on("connect", () => {
        console.log("[Socket] Connected successfully");
        set({ isConnected: true, isConnecting: false });
        get().sendOfflineMessages();
      });

      socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
        set({ isConnected: false, isConnecting: false });
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
