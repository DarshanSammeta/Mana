import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { useEffect } from "react";

export const useConversations = () => {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axios.get("/api/chat/conversations", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    enabled: !!accessToken,
  });
};

export const useMessages = (conversationId: string) => {
  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("conversation:join", conversationId);

    const handleNewMessage = (message: any) => {
      if (message.conversationId === conversationId) {
        queryClient.setQueryData(["messages", conversationId], (old: any) => {
          return old ? [...old, message] : [message];
        });
      }
    };

    socket.on("message:receive", handleNewMessage);

    return () => {
      socket.off("message:receive", handleNewMessage);
    };
  }, [socket, conversationId, queryClient]);

  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await axios.get(`/api/chat/messages?conversationId=${conversationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    enabled: !!accessToken && !!conversationId,
  });
};

export const useSendMessage = () => {
  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content, attachments }: any) => {
      const res = await axios.post("/api/chat/messages", { conversationId, content, attachments }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(["messages", newMessage.conversationId], (old: any) => {
        return old ? [...old, newMessage] : [newMessage];
      });
      socket?.emit("message:send", newMessage);
    },
  });
};
