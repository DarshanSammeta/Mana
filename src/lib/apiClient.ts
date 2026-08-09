import axios from "axios";
import axiosRetry from "axios-retry";
import { useAuthStore } from "@/store/authStore";

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
  withCredentials: true, // required so the httpOnly refreshToken cookie is sent cross-origin
});

// Separate minimal instance for the refresh call itself. Kept outside apiClient's
// interceptor chain (see the originalRequest.url guard below) to avoid re-triggering
// the 401 handler on a failed refresh. Must ALSO carry credentials explicitly —
// a bare `axios.post(...)` does NOT inherit apiClient's config.
const refreshClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Configure retry logic
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx responses
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status ? error.response.status >= 500 : false);
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response Interceptor for session expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop if the refresh request itself fails
    if (originalRequest.url === "/auth/refresh" || originalRequest.url === "/api/auth/refresh") {
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const { accessToken: currentToken } = useAuthStore.getState();

      // If token is already missing from state, session is dead. Don't attempt refresh.
      if (!currentToken) {
        console.warn("[apiClient] 401 received but token is missing from state. Rejecting.");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const requestId = originalRequest.headers?.['x-request-id'] || 'no-id';
      console.log(`[apiClient] Initiating session refresh for request: ${requestId}`);

      try {
        const { data } = await refreshClient.post("/auth/refresh");
        const { accessToken } = data;

        console.log(`[apiClient] Session refresh successful for request: ${requestId}`);
        const { setUser, user } = useAuthStore.getState();
        setUser(user, accessToken);

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        console.error(`[apiClient] Session refresh failed for request: ${requestId}`, refreshError);
        processQueue(refreshError, null);

        const { logout } = useAuthStore.getState();
        const status = refreshError.response?.status;

        // Force logout ONLY if the server explicitly rejects the refresh token (401/403)
        // This prevents accidental logouts on transient network failures
        if (typeof window !== "undefined" && (status === 401 || status === 403)) {
            console.warn("[apiClient] Session dead (401/403). Forcing redirect to login.");
            // Clear state immediately to stop other concurrent requests from trying to refresh
            useAuthStore.setState({ accessToken: null, user: null });
            logout();
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;