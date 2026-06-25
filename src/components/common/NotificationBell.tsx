"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

export function NotificationBell() {
  const { user } = useAuthStore();

  // Static notifications for visual representation as requested
  const notifications = [
    { id: 1, title: "Booking Confirmed", message: "Your booking with 'The Grand Venue' is confirmed.", time: "2h ago" },
    { id: 2, title: "New Offer", message: "Get 20% off on your next photography session.", time: "5h ago" }
  ];

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
          <Bell className="h-5 w-5 text-white" />
          <span className="absolute top-1 right-1 h-4 w-4 bg-[#F59E0B] text-black text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#111827]">
            2
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="bg-[#F8FAFC] px-4 py-3 border-b">
           <h3 className="font-bold text-sm">Notifications</h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.map((n) => (
            <DropdownMenuItem key={n.id} className="p-4 cursor-pointer hover:bg-slate-50 border-b last:border-0 block">
              <p className="font-bold text-xs mb-1">{n.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
              <p className="text-[10px] text-blue-600 font-bold mt-2">{n.time}</p>
            </DropdownMenuItem>
          ))}
        </div>
        <Link href="/customer/notifications" className="block text-center py-3 text-xs font-bold text-[#6D28D9] hover:bg-slate-50">
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
