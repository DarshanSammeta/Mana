"use client";

import { useEffect } from "react";
import { useSocketStore } from "@/store/socketStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";

export const NotificationListener = () => {
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();
  const pathname = usePathname();

  useEffect(() => {
    if (!socket) return;

    // Debounced invalidation to prevent main-thread blocking during socket bursts
    const invalidate = (keys: string[][]) => {
      const timeoutId = setTimeout(() => {
        keys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      }, 100);
      return () => clearTimeout(timeoutId);
    };

    const handleNewNotification = (notification: any) => {
      invalidate([["notifications"], ["customer-stats"]]);

      // Show a toast
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-purple-600 hover:text-purple-500 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ), { duration: 5000 });
    };

    const handleBookingUpdate = (data: any) => {
      invalidate([["bookings"], ["customer-stats"], ["vendor-stats"]]);
      toast.success(data.message || "Booking updated");
    };

    const handleNewMessage = (data: any) => {
      invalidate([["messages"], ["conversations"]]);
      // Only toast if not on the chat page
      if (pathname !== "/customer/messages" && pathname !== "/vendor/messages") {
        toast.success(`New message from ${data.senderName}`);
      }
    };

    const handleVendorUpdate = () => {
      invalidate([["marketplace"]]);
    };

    socket.on("notification:receive", handleNewNotification);
    socket.on("booking:updated", handleBookingUpdate);
    socket.on("message:receive", handleNewMessage);
    socket.on("vendor:updated", handleVendorUpdate);
    socket.on("vendor:new", handleVendorUpdate);

    return () => {
      socket.off("notification:receive", handleNewNotification);
      socket.off("booking:updated", handleBookingUpdate);
      socket.off("message:receive", handleNewMessage);
      socket.off("vendor:updated", handleVendorUpdate);
      socket.off("vendor:new", handleVendorUpdate);
    };
  }, [socket, queryClient, pathname]);

  return null;
};
