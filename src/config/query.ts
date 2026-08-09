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
        // Stop retrying immediately for authentication and "not found" errors
        const status = error?.response?.status;
        const errorCode = error?.response?.data?.code || error?.code;

        const isAuthError = status === 401 || status === 403 ||
                           (errorCode && (errorCode.startsWith("ERR_JWT_") || errorCode === "UNAUTHORIZED" || errorCode === "TOKEN_EXPIRED"));

        if (isAuthError || status === 404) return false;

        return failureCount < 1; // Default to one retry for other transient errors
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
};
