import { useEffect, useState } from "react";
import { useSocketStore } from "@/store/socketStore";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";

export const useLiveNotifications = () => {
  const { socket } = useSocketStore();
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (Array.isArray(notifications)) {
      setUnreadCount(notifications.filter((n: any) => !n.isRead).length);
    }
  }, [notifications]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = (notification: any) => {
      queryClient.setQueryData(["notifications"], (old: any) => {
        const currentList = Array.isArray(old) ? old : [];
        const updated = [notification, ...currentList];
        return updated;
      });
      setUnreadCount(prev => prev + 1);

      // Show browser notification if permitted
      if (Notification.permission === "granted") {
          new Notification(notification.title, { body: notification.message });
      }
    };

    const handleBookingUpdate = (_update: any) => {
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        // Optionally show a specific toast or notification
    };

    socket.on("notification:new", handleNotification);
    socket.on("booking:update", handleBookingUpdate);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("booking:update", handleBookingUpdate);
    };
  }, [socket, user, queryClient]);

  return { unreadCount, notifications };
};
