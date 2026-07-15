"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { useCommerceSync } from "@/hooks/useCommerceSync";
import { NotificationListener } from "@/components/notifications/NotificationListener";

function CommerceSync() {
  useCommerceSync();
  return null;
}

import { AuthProvider } from "@/components/auth/AuthProvider";

import { QUERY_CLIENT_CONFIG } from "@/config/query";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(QUERY_CLIENT_CONFIG));

  // Use selective selectors to prevent root-level re-renders
  const accessToken = useAuthStore(state => state.accessToken);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const user = useAuthStore(state => state.user);

  const connect = useSocketStore(state => state.connect);
  const disconnect = useSocketStore(state => state.disconnect);

  useEffect(() => {
    // Prevent connecting with potentially stale/invalid token during hydration/initialization
    if (!isInitialized) return;

    if (accessToken && user) {
      connect(accessToken);
    } else {
      disconnect();
    }
  }, [accessToken, connect, disconnect, isInitialized, user]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CommerceSync />
        <NotificationListener />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
