import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useMarketingCampaigns = (filters?: any) => {
  return useQuery({
    queryKey: ["marketing-campaigns", filters],
    queryFn: async () => {
      const { data } = await axios.get("/api/marketing/campaigns", { params: filters });
      return data;
    },
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaignData: any) => {
      const { data } = await axios.post("/api/marketing/campaigns", campaignData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
    },
  });
};

export const useCRMData = (userId: string) => {
  return useQuery({
    queryKey: ["customer-crm", userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/marketing/crm/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
};

export const useMarketingAnalytics = (campaignId?: string) => {
  return useQuery({
    queryKey: ["marketing-analytics", campaignId],
    queryFn: async () => {
      const { data } = await axios.get("/api/marketing/analytics", { params: { campaignId } });
      return data;
    },
  });
};

export const useTrackMarketing = () => {
  return useMutation({
    mutationFn: async (eventData: { campaignId?: string; eventType: string; source?: string }) => {
      await axios.post("/api/marketing/track", eventData);
    },
  });
};
