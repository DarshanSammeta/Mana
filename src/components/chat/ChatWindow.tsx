"use client"

import { useState, useRef } from "react";
import { useMessages, useSendMessage, useTyping } from "@/hooks/chat/useChat";
import { MessageBubble } from "./MessageBubble";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, MoreVertical, Phone, Video, Smile, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { motion, AnimatePresence } from "framer-motion";

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow = ({ conversationId }: ChatWindowProps) => {
  const [content, setContent] = useState("");
  const {
    data,
    isLoading,
    isFetchingNextPage
  } = useMessages(conversationId);

  const messages = data?.pages.flatMap((page) => page.items) || [];

  const { mutate: sendMessage } = useSendMessage();
  const { setTyping } = useTyping(conversationId);
  const { user } = useAuthStore();
  const { typingUsers } = useSocketStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOtherTyping = Array.from(typingUsers[conversationId] || []).some(id => id !== user?.id);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    sendMessage({
      conversationId,
      content,
    });
    setContent("");
    setTyping(false);
  };

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Loading messages...</p>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-sm font-black shadow-inner">
                    {messages?.[0]?.senderId === user?.id ? "C" : "V"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
            </div>
            <div>
                <h3 className="font-black text-sm text-gray-900 tracking-tight">Event Coordination</h3>
                <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Active Now
                    </p>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                <Video className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-6 bg-gray-100 mx-1" />
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                <MoreVertical className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4 bg-slate-50" ref={scrollRef}>
        <div className="flex flex-col gap-2 max-w-4xl mx-auto">
            <div ref={observerTarget} className="h-4 w-full" />
            {isFetchingNextPage && (
                <div className="flex justify-center p-4">
                    <div className="h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            )}
            <div className="flex justify-center mb-6">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Event Day Coordination
                </span>
            </div>
            <AnimatePresence initial={false}>
                {messages?.map((msg: any) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <MessageBubble
                            message={msg}
                            isOwn={msg.senderId === user?.id}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {isOtherTyping && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 ml-2 mb-4"
                >
                    <div className="flex gap-1 bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-none">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    </div>
                </motion.div>
            )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
          <form
            onSubmit={handleSend}
            className="flex flex-col gap-2 max-w-4xl mx-auto bg-gray-50 border border-gray-200 rounded-[1.5rem] p-1.5 focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm"
          >
            <textarea
              placeholder="Send a message to coordinate..."
              value={content}
              rows={1}
              onChange={handleTyping}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                  }
              }}
              className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2.5 px-3 resize-none max-h-32 min-h-[44px] overflow-y-auto font-medium placeholder:text-gray-400"
            />

            <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                        <Smile className="h-4 w-4" />
                    </Button>
                </div>

                <Button
                    type="submit"
                    size="sm"
                    disabled={!content.trim()}
                    className="bg-primary hover:bg-primary/90 text-white font-black h-9 px-6 rounded-xl shadow-md shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                >
                    <span>SEND</span>
                    <Send className="h-3.5 w-3.5" />
                </Button>
            </div>
          </form>
          <p className="text-[10px] text-center text-gray-400 font-bold mt-2 uppercase tracking-tighter">
            Messages are end-to-end encrypted
          </p>
      </div>
    </div>
  );
};
