"use client"

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Paperclip } from "lucide-react";

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
        {message.attachments?.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((url: string, i: number) => {
              const isImage = url.match(/\.(jpeg|jpg|gif|png)$/) != null;
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "block overflow-hidden rounded-lg border transition-all",
                    isOwn ? "border-white/20 hover:bg-white/10" : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {isImage ? (
                    <img src={url} alt="attachment" className="w-full h-32 object-cover" />
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
      <div className="flex items-center gap-1 mt-1 px-1">
        <span className="text-[10px] text-gray-500 font-medium">
            {format(new Date(message.createdAt), "h:mm a")}
        </span>
      </div>
    </div>
  );
};
