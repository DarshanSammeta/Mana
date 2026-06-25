import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  connect: (token: string) => {
    if (get().socket?.connected) return;

    const socket = io(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", {
      auth: { token },
      path: "/api/socket/io",
    });

    socket.on("connect", () => set({ isConnected: true }));
    socket.on("disconnect", () => set({ isConnected: false }));

    set({ socket });
  },
  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false });
  },
}));
