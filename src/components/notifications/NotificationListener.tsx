"use client";

import { useEffect, useRef } from "react";
import { useSocketStore } from "@/store/socketStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Bell, MessageSquare, Package, CreditCard } from "lucide-react";
import { usePathname } from "next/navigation";
import { SOCKET_EVENTS } from "@/constants/socket-events";

/**
 * Global Notification & Socket Listener
 * Handles all real-time event side-effects: toasts, query invalidations, and browser notifications.
 * This is the SINGLE SOURCE OF TRUTH for global socket event side-effects.
 */
export const NotificationListener = () => {
  const socket = useSocketStore(state => state.socket);
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const processedNotifications = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    // Helper for bached invalidation
    const invalidate = (keys: any[][]) => {
      // Small timeout to allow DB to settle if needed, and batch multiple invalidations
      setTimeout(() => {
        keys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      }, 150);
    };

    const handleNewNotification = (notification: any) => {
      if (processedNotifications.current.has(notification.id)) return;
      processedNotifications.current.add(notification.id);

      // Cleanup ref
      if (processedNotifications.current.size > 100) {
        const first = processedNotifications.current.values().next().value;
        if (first) processedNotifications.current.delete(first);
      }

      // Invalidate both the list and the unread count
      invalidate([
        ["notifications", "list"],
        ["notifications", "unread-count"],
        ["customer-stats"],
        ["vendor-stats"]
      ]);

      // Browser Notification
      if (Notification.permission === "granted" && document.visibilityState !== "visible") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/icon-192x192.png"
        });
      }

      // Determine Icon based on category
      let Icon = Bell;
      let iconColor = "text-purple-600";
      let bgColor = "bg-purple-100";

      if (notification.category === "BOOKING") {
        Icon = Package;
        iconColor = "text-blue-600";
        bgColor = "bg-blue-100";
      } else if (notification.category === "PAYMENT") {
        Icon = CreditCard;
        iconColor = "text-emerald-600";
        bgColor = "bg-emerald-100";
      } else if (notification.category === "CHAT") {
        Icon = MessageSquare;
        iconColor = "text-amber-600";
        bgColor = "bg-amber-100";
      }

      // Show Custom Toast
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-slate-100`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center shadow-inner`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{notification.message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-100">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                if (notification.link) window.location.href = notification.link;
              }}
              className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-xs font-black text-primary hover:bg-slate-50 focus:outline-none uppercase tracking-widest"
            >
              View
            </button>
          </div>
        </div>
      ), { duration: 6000 });
    };

    const handleBookingUpdate = (data: any) => {
      invalidate([
        ["bookings"],
        ["booking", data.bookingId],
        ["customer-stats"],
        ["vendor-stats"]
      ]);
      if (data.message && !processedNotifications.current.has(data.id || data.bookingId + data.status)) {
         toast.success(data.message, { id: data.id || data.bookingId + data.status });
      }
    };

    const handleNewMessage = (data: any) => {
      invalidate([["conversations"], ["messages", data.conversationId]]);

      // Only show toast if NOT on the specific conversation page
      const isCurrentConversation = pathname?.includes(`/messages/${data.conversationId}`);
      if (!isCurrentConversation) {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-[#111827] text-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-white ring-opacity-10 overflow-hidden`}>
                <div className="flex-1 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-primary">New Message</p>
                        <p className="text-sm font-bold truncate max-w-[200px]">{data.content}</p>
                    </div>
                </div>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="p-4 border-l border-white/10 text-xs font-bold hover:bg-white/5"
                >
                    Dismiss
                </button>
            </div>
        ));
      }
    };

    const handlePresenceUpdate = () => {
        // Debounced invalidation of presence-related data if any
    };

    // Standardized Listeners
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);

    // Booking Events (Full Lifecycle)
    const bookingEvents = [
      SOCKET_EVENTS.BOOKING_CREATED,
      SOCKET_EVENTS.BOOKING_ASSIGNED,
      SOCKET_EVENTS.BOOKING_ACCEPTED,
      SOCKET_EVENTS.BOOKING_NEGOTIATING,
      SOCKET_EVENTS.BOOKING_CONFIRMED,
      SOCKET_EVENTS.BOOKING_TRAVELING,
      SOCKET_EVENTS.BOOKING_ARRIVED,
      SOCKET_EVENTS.BOOKING_OTP,
      SOCKET_EVENTS.BOOKING_STARTED,
      SOCKET_EVENTS.BOOKING_COMPLETED,
      SOCKET_EVENTS.BOOKING_PAYMENT,
    ];

    bookingEvents.forEach(event => socket.on(event, handleBookingUpdate));

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);
    socket.on(SOCKET_EVENTS.VENDOR_UPDATED, () => invalidate([["marketplace"]]));

    // Wallet Updates
    const handleWalletUpdate = (data: any) => {
        invalidate([["vendor-earnings"], ["vendor-transactions-earnings"], ["wallet"]]);
        if (data.amount) {
            toast.success(`Wallet Balance Updated: ₹${data.amount}`, { icon: '💰' });
        }
    };
    socket.on("wallet:updated", handleWalletUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);
      bookingEvents.forEach(event => socket.off(event, handleBookingUpdate));
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off(SOCKET_EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);
      socket.off("wallet:updated", handleWalletUpdate);
      socket.off(SOCKET_EVENTS.VENDOR_UPDATED);
    };
  }, [socket, queryClient, pathname]);

  return null;
};
