import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";

export function useRecommendations(params?: { city?: string; eventType?: string }) {
  const user = useAuthStore(state => state.user);
  const isInitialized = useAuthStore(state => state.isInitialized);

  return useQuery({
    queryKey: ["recommendations", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any);
      const { data } = await apiClient.get(`/customer/recommendations?${searchParams.toString()}`);
      return data;
    },
    enabled: isInitialized && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data } = await apiClient.get("/customer/wallet");
      return data;
    },
  });
}

export function useCustomerAnalytics() {
  return useQuery({
    queryKey: ["customer-analytics"],
    queryFn: async () => {
      const { data } = await apiClient.get("/customer/analytics");
      return data;
    },
  });
}
