import axios from "axios";
import axiosRetry from "axios-retry";
import { useAuthStore } from "@/store/authStore";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
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
      originalRequest._retry = true;
      try {
        const { data } = await axios.post("/api/auth/refresh");
        const { setUser, user } = useAuthStore.getState();
        setUser(user, data.accessToken);

        // Update both the header and the original request
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth state and redirect
        const { logout } = useAuthStore.getState();
        if (typeof window !== "undefined") {
            logout();
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
