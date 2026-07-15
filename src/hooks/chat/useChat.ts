import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { useEffect } from "react";
import { chatService } from "@/services/client";
import { SOCKET_EVENTS } from "@/constants/socket-events";

export const useConversations = () => {
  const { accessToken: _accessToken } = useAuthStore();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => chatService.getConversations(),
    enabled: !!_accessToken,
  });
};

export const useMessages = (conversationId: string) => {
  const { accessToken: _accessToken, user } = useAuthStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("conversation:join", conversationId);

    const handleNewMessage = (message: any) => {
      if (message.conversationId === conversationId) {
        // Mark as read immediately if window is active (simplified)
        if (message.senderId !== user?.id) {
          socket.emit("message:read", { messageId: message.id, conversationId });
        }

        queryClient.setQueryData(["messages", conversationId], (old: any) => {
          if (!old) return { pages: [{ items: [message], nextCursor: null }], pageParams: [undefined] };
          const newPages = [...old.pages];
          newPages[0] = { ...newPages[0], items: [message, ...newPages[0].items] };
          return { ...old, pages: newPages };
        });
      }
    };

    const handleMessageStatus = ({ messageId, status }: any) => {
      queryClient.setQueryData(["messages", conversationId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((msg: any) =>
              msg.id === messageId ? { ...msg, status } : msg
            )
          }))
        };
      });
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on("message:status", handleMessageStatus);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off("message:status", handleMessageStatus);
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, conversationId);
    };
  }, [socket, conversationId, queryClient, user?.id]);

  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => chatService.getMessages(conversationId, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!_accessToken && !!conversationId,
  });
};

export const useSendMessage = () => {
  const { accessToken: _accessToken, user } = useAuthStore();
  const { socket, isConnected } = useSocketStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content, attachments }: any) => {
      const tempId = crypto.randomUUID();
      const optimisticMsg = {
        id: tempId,
        conversationId,
        content,
        senderId: user?.id,
        createdAt: new Date().toISOString(),
        status: "sending",
        user: { id: user?.id, fullName: user?.fullName },
        messageattachment: attachments || []
      };

      // Optimistic update
      queryClient.setQueryData(["messages", conversationId], (old: any) => {
        if (!old) return { pages: [{ items: [optimisticMsg], nextCursor: null }], pageParams: [undefined] };
        const newPages = [...old.pages];
        newPages[0] = { ...newPages[0], items: [optimisticMsg, ...newPages[0].items] };
        return { ...old, pages: newPages };
      });

      if (!isConnected) {
          // Handled by offline queue in store?
          // For now, let's proceed with API call which might fail or be cached
      }

      const res = await chatService.sendMessage({ conversationId, content, attachments });
      return { ...res, tempId };
    },
    onSuccess: (data) => {
      const { tempId, ...newMessage } = data;
      queryClient.setQueryData(["messages", newMessage.conversationId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((msg: any) =>
              msg.id === tempId ? { ...newMessage, status: "sent" } : msg
            )
          }))
        };
      });
      socket?.emit("message:send", newMessage, (ack: any) => {
        if (ack.status === "ok") {
            // Update to delivered if ack received
        }
      });
    },
  });
};

export const useTyping = (conversationId: string) => {
    const { socket } = useSocketStore();
    useEffect(() => {}, []);

    const setTyping = (isTyping: boolean) => {
        if (!socket) return;
        socket.emit(isTyping ? "typing:start" : "typing:stop", conversationId);
    };

    return { setTyping };
};
