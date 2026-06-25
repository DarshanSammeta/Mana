"use client"

import { useState } from "react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function VendorMessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-140px)] border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
      <div className="w-80 border-r border-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-50 font-black text-slate-900 bg-slate-50/50 uppercase tracking-widest text-[10px]">
            Inquiries & Bookings
        </div>
        <div className="flex-1 overflow-y-auto">
            <ConversationList
                selectedId={selectedId || undefined}
                onSelect={setSelectedId}
            />
        </div>
      </div>
      <div className="flex-1 bg-slate-50/30">
        {selectedId ? (
          <ChatWindow conversationId={selectedId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <div className="h-20 w-20 rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <div className="h-4 w-4 bg-blue-600 rounded-full animate-pulse" />
                </div>
            </div>
            <p className="font-bold text-slate-900">Select a chat to respond to customers</p>
            <p className="text-xs text-slate-500 max-w-[200px] text-center">Your active inquiries and booking discussions will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
