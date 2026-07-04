import { QueryClientConfig } from "@tanstack/react-query";

export const QUERY_CLIENT_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false, // Reduced for performance
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401 || error?.response?.status === 404) return false;
        return failureCount < 1; // Faster fail-fast in production
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
};
