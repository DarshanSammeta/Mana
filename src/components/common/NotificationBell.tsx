"use client";

import { Bell, Check, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useLiveNotifications } from "@/hooks/useLiveNotifications";
import { formatDistanceToNow } from "date-fns";
import { notificationService } from "@/services";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { user } = useAuthStore();
  const { unreadCount, notifications } = useLiveNotifications();
  const queryClient = useQueryClient();

  if (!user) return null;

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "BOOKING": return "bg-blue-100 text-blue-600";
      case "PAYMENT": return "bg-emerald-100 text-emerald-600";
      case "CHAT": return "bg-purple-100 text-purple-600";
      case "URGENT": return "bg-rose-100 text-rose-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none">
          <Bell className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-[#F59E0B] text-black text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#111827] animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden border-slate-200 rounded-2xl shadow-2xl">
        <div className="bg-slate-50/80 backdrop-blur-sm px-4 py-3 border-b flex justify-between items-center">
           <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Notifications</h3>
           {unreadCount > 0 && (
             <button
               onClick={(e) => {
                 e.preventDefault();
                 markAllAsRead();
               }}
               className="text-[10px] font-black text-primary hover:text-blue-700 flex items-center gap-1 uppercase tracking-tighter"
             >
               <Check className="h-3 w-3" /> Mark all read
             </button>
           )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications && notifications.length > 0 ? (
            notifications.map((n: any) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => !n.isRead && markAsRead(n.id)}
                className={cn(
                  "p-4 cursor-pointer border-b last:border-0 block transition-colors",
                  n.isRead ? "opacity-60 grayscale-[0.5]" : "bg-blue-50/30 hover:bg-blue-50"
                )}
              >
                <div className="flex gap-3">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", getCategoryColor(n.category))}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs mb-0.5", n.isRead ? "font-semibold" : "font-black")}>{n.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-1 mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1 shadow-sm shadow-primary/40" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="py-12 px-4 text-center">
              <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Bell className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-400">All caught up!</p>
              <p className="text-[10px] text-slate-400 mt-1">No new notifications to show.</p>
            </div>
          )}
        </div>
        <Link
          href={user?.role === "VENDOR" ? "/vendor/notifications" : "/customer/notifications"}
          className="block text-center py-4 text-[10px] font-black text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors uppercase tracking-widest border-t"
        >
          View all history
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
