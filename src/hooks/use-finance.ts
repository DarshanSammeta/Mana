import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useExecutiveSummary = () => {
  return useQuery({
    queryKey: ["finance-executive-summary"],
    queryFn: async () => {
      const { data } = await axios.get("/api/finance/bi/summary");
      return data;
    },
    refetchInterval: 300000, // 5 mins
  });
};

export const useVendorSettlements = (vendorId?: string) => {
  return useQuery({
    queryKey: ["vendor-settlements", vendorId],
    queryFn: async () => {
      const { data } = await axios.get("/api/finance/settlements", { params: { vendorId } });
      return data;
    },
  });
};

export const useTransactions = (walletId: string) => {
  return useQuery({
    queryKey: ["wallet-transactions", walletId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/finance/wallets/${walletId}/transactions`);
      return data;
    },
  });
};

export const useRequestRefund = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (refundData: { bookingId: string, amount: number, reason: string }) => {
            const { data } = await axios.post("/api/finance/refunds", refundData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
        }
    });
};
