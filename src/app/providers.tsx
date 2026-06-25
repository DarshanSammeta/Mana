"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { useCart, useWishlist } from "@/hooks/useCommerce";
import { useCommerceSync } from "@/hooks/useCommerceSync";
import { NotificationListener } from "@/components/notifications/NotificationListener";

function CommerceSync() {
  useCommerceSync();
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const { accessToken } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (accessToken) {
      connect(accessToken);
    } else {
      disconnect();
    }
  }, [accessToken, connect, disconnect]);

  return (
    <QueryClientProvider client={queryClient}>
      <CommerceSync />
      <NotificationListener />
      {children}
    </QueryClientProvider>
  );
}
