"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Image as ImageIcon,
  Check,
  CheckCheck,
  User,
  Phone,
  Video,
  ChevronLeft,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useConversations, useMessages, useSendMessage } from "@/hooks/chat/useChat";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedId || "");
  const sendMessage = useSendMessage();

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectedChat = conversations?.find((c: any) => c.id === selectedId);
  const otherParticipant = selectedChat?.conversationparticipant?.find((p: any) => p.userId !== user?.id)?.user;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedId,
        content: newMessage
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="h-[calc(100vh-220px)] flex bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-slate-100 flex flex-col",
        selectedId ? "hidden md:flex" : "flex"
      )}>
         <div className="p-6 border-b border-slate-50">
            <h1 className="text-xl font-bold text-slate-900 mb-4">Messages</h1>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input placeholder="Search chats..." className="pl-10 bg-slate-50 border-none rounded-xl" />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : conversations?.length > 0 ? (
              conversations.map((chat: any) => {
                const other = chat.conversationparticipant?.find((p: any) => p.userId !== user?.id)?.user;
                const lastMsg = chat.message?.[0];
                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedId(chat.id)}
                    className={cn(
                      "p-4 flex gap-4 cursor-pointer hover:bg-slate-50 transition-colors relative",
                      selectedId === chat.id ? "bg-blue-50/50" : ""
                    )}
                  >
                    <div className="relative shrink-0">
                       <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                          {other?.vendorprofile?.logo ? (
                            <img src={other.vendorprofile.logo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-6 w-6" />
                          )}
                       </div>
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {other?.vendorprofile?.businessName || other?.fullName || "Chat"}
                          </h3>
                          {lastMsg && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {format(new Date(lastMsg.createdAt), 'p')}
                            </span>
                          )}
                       </div>
                       <p className="text-xs text-slate-500 truncate">{lastMsg?.content || "No messages yet"}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center text-slate-400">
                No conversations found
              </div>
            )}
         </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-slate-50/30",
        !selectedId ? "hidden md:flex" : "flex"
      )}>
         {selectedId ? (
            <>
               <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSelectedId(null)}
                     >
                        <ChevronLeft className="h-5 w-5" />
                     </Button>
                     <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                        {otherParticipant?.vendorprofile?.logo ? (
                          <img src={otherParticipant.vendorprofile.logo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                     </div>
                     <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {otherParticipant?.vendorprofile?.businessName || otherParticipant?.fullName || "Chat"}
                        </h3>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400"><Phone className="h-4 w-4" /></Button>
                     <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400"><Video className="h-4 w-4" /></Button>
                     <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {loadingMessages ? (
                    <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                  ) : messages?.map((msg: any) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex gap-3 max-w-[80%]", isMe ? "flex-row-reverse ml-auto" : "")}>
                         {!isMe && (
                           <div className="h-8 w-8 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center text-slate-400 overflow-hidden">
                              {otherParticipant?.vendorprofile?.logo ? (
                                <img src={otherParticipant.vendorprofile.logo} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                           </div>
                         )}
                         <div className={cn(
                           "p-4 rounded-2xl shadow-sm border",
                           isMe ? "bg-blue-600 text-white border-blue-600 rounded-tr-none" : "bg-white text-slate-700 border-slate-100 rounded-tl-none"
                         )}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <div className={cn("flex items-center gap-1 mt-2", isMe ? "justify-end" : "")}>
                               <p className={cn("text-[10px] font-medium", isMe ? "text-blue-100" : "text-slate-400")}>
                                 {format(new Date(msg.createdAt), 'p')}
                               </p>
                               {isMe && <CheckCheck className="h-3 w-3 text-blue-100" />}
                            </div>
                         </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
               </div>

               <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl">
                     <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-blue-600"><Paperclip className="h-5 w-5" /></Button>
                     <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="border-none bg-transparent focus-visible:ring-0"
                     />
                     <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-blue-600"><ImageIcon className="h-5 w-5" /></Button>
                     <Button
                        type="submit"
                        disabled={!newMessage.trim() || sendMessage.isPending}
                        className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white p-0"
                     >
                        {sendMessage.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                     </Button>
                  </div>
               </form>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
               <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center shadow-lg mb-6">
                  <MessageSquareIcon className="h-10 w-10 text-blue-200" />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Your Conversations</h3>
               <p className="text-sm text-slate-500 mt-2 max-w-xs">Select a vendor from the list to start chatting about your event requirements.</p>
            </div>
         )}

      </div>
    </div>
  );
}

function MessageSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
