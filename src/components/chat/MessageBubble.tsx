"use client"

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, CheckCheck, Paperclip } from "lucide-react";
import Image from "next/image";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
}

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  return (
    <div
      className={cn("flex flex-col mb-3", isOwn ? "items-end" : "items-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-[1.25rem] px-4 py-2.5 shadow-sm relative group",
          isOwn
            ? "bg-primary text-white rounded-tr-none"
            : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {message.messageattachment?.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.messageattachment.map((att: any, i: number) => {
              const isImage = att.type === 'IMAGE' || att.url.match(/\.(jpeg|jpg|gif|png)$/) != null;
              return (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "block overflow-hidden rounded-lg border transition-all",
                    isOwn ? "border-white/20 hover:bg-white/10" : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {isImage ? (
                    <div className="relative w-full h-32">
                      <Image src={att.url} alt="attachment" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="p-2 flex items-center gap-2 text-xs">
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate">File Attachment {i + 1}</span>
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1 px-1">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
            {format(new Date(message.createdAt), "h:mm a")}
        </span>
        {isOwn && (
            <div className="flex">
                {(message?.status === "read" || message?.isRead) ? (
                    <CheckCheck className="h-3 w-3 text-blue-500" />
                ) : message?.status === "sent" ? (
                    <CheckCheck className="h-3 w-3 text-gray-300" />
                ) : (
                    <Check className="h-3 w-3 text-gray-300" />
                )}
            </div>
        )}
      </div>
    </div>
  );
};
