"use client"

import { useConversations } from "@/hooks/chat/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/store/authStore";

interface ConversationListProps {
  selectedId?: string;
  onSelect: (id: string) => void;
}

export const ConversationList = ({ selectedId, onSelect }: ConversationListProps) => {
  const { data: rawConversations, isLoading } = useConversations();
  const { user } = useAuthStore();

  const conversations = rawConversations?.map((conv: any) => {
    const otherParticipant = conv.conversationparticipant?.find((p: any) => p.user.id !== user?.id);
    const otherUser = otherParticipant?.user;
    const lastMessage = conv.message?.[0];

    return {
      id: conv.id,
      otherUser: {
        id: otherUser?.id,
        name: otherUser?.fullName || otherUser?.vendorprofile?.businessName || "Unknown",
        image: otherUser?.vendorprofile?.logo || null,
        role: otherUser?.role
      },
      lastMessage,
    };
  });

  if (isLoading) return (
    <div className="p-4 space-y-4">
        {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-gray-100 animate-pulse rounded" />
                    <div className="h-2 w-full bg-gray-100 animate-pulse rounded" />
                </div>
            </div>
        ))}
    </div>
  );

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {conversations?.map((conv: any) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100",
              selectedId === conv.id
                ? "bg-purple-50"
                : "hover:bg-gray-50"
            )}
          >
            <div className="relative shrink-0">
                <Avatar className="h-10 w-10 border border-gray-200">
                    <AvatarImage src={conv.otherUser.image} className="object-cover" />
                    <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs uppercase">
                        {conv.otherUser.name?.[0]}
                    </AvatarFallback>
                </Avatar>
                {/* Status indicator - Amazon style is simpler, let's keep it subtle */}
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <p className={cn("text-sm font-bold truncate", selectedId === conv.id ? "text-purple-900" : "text-gray-900")}>
                    {conv.otherUser.name}
                </p>
                {conv.lastMessage && (
                  <span className="text-[10px] text-gray-500">
                    {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-600 truncate">
                    {conv.lastMessage?.content || "No messages yet"}
                </p>
                {selectedId !== conv.id && (
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-600 shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
