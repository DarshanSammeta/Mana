import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/client";

/**
 * Hook for consuming notification data.
 * Socket listeners are handled globally in NotificationListener to prevent duplication.
 * Supports infinite scrolling for the notification bell/list.
 */
export const useLiveNotifications = () => {
  const accessToken = useAuthStore(state => state.accessToken);

  // 1. Fetch unread count separately for high-performance badge updates
  const { data: unreadData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await notificationService.getNotifications(1);
      return res.unreadCount || 0;
    },
    enabled: !!accessToken,
    refetchInterval: 60000, // Fallback poll every minute
    refetchOnWindowFocus: false, // Prevent redundant calls on tab switch if socket is active
  });

  // 2. Infinite query for the notification list
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ["notifications", "list"],
    queryFn: ({ pageParam }) => notificationService.getNotifications(10, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!accessToken,
    staleTime: 30000,
  });

  const notifications = useMemo(() =>
    data?.pages.flatMap(page => page?.items).filter(Boolean) || [],
  [data]);

  const unreadCount = unreadData ?? (notifications.filter((n: any) => n && !n.isRead).length);

  return {
    notifications,
    unreadCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  };
};
