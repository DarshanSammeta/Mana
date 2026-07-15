import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useRecommendations(params?: { city?: string; eventType?: string }) {
  return useQuery({
    queryKey: ["recommendations", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any);
      const { data } = await apiClient.get(`/customer/recommendations?${searchParams.toString()}`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useWishlist() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data } = await apiClient.get("/customer/wishlist");
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ type, targetId }: { type: "VENDOR" | "SERVICE"; targetId: string }) => {
      const { data } = await apiClient.post("/customer/wishlist", { type, targetId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  return { ...query, toggle };
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

export function useSavedSearches() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["saved-searches"],
    queryFn: async () => {
      const { data } = await apiClient.get("/customer/saved-searches");
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (searchData: any) => {
      const { data } = await apiClient.post("/customer/saved-searches", searchData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });

  return { ...query, save };
}
