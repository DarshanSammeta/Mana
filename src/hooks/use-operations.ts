import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// --- Support Tickets ---

export const useSupportTickets = () => {
  return useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const { data } = await axios.get("/api/ops/tickets");
      return data;
    },
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketData: { category: string; subject: string; description: string; priority: string }) => {
      const { data } = await axios.post("/api/ops/tickets", ticketData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
};

// --- Disputes ---

export const useDisputes = (bookingId?: string) => {
  return useQuery({
    queryKey: ["disputes", bookingId],
    queryFn: async () => {
      const { data } = await axios.get("/api/ops/disputes", { params: { bookingId } });
      return data;
    },
  });
};

export const useRaiseDispute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (disputeData: { bookingId: string; reason: string; description: string; evidence?: any }) => {
      const { data } = await axios.post("/api/ops/disputes", disputeData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["disputes", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useResolveDispute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { disputeId: string; resolution: string; status: "RESOLVED" | "CLOSED" }) => {
      const { data: result } = await axios.patch("/api/ops/disputes", data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
};

// --- Cancellations ---

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bookingId: string; reason: string }) => {
      const { data: result } = await axios.post("/api/ops/cancellations", data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};
