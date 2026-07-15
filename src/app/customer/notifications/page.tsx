"use client";

import { useEffect } from "react";
import {
  Bell,
  Check,
  Calendar,
  CreditCard,
  MessageSquare,
  Zap,
  MoreVertical,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import { notificationService } from "@/services/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await notificationService.getNotifications(20, pageParam as any);
      // Backend returns { notifications: [], unreadCount: 0 }
      // The component expects items and nextCursor
      return {
        items: response.notifications || [],
        unreadCount: response.unreadCount || 0,
        nextCursor: response.notifications?.length === 20 ? (pageParam as number) + 20 : undefined
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Failed to update notifications");
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING': return { icon: Calendar, bg: 'bg-info/10', text: 'text-info' };
      case 'PAYMENT': return { icon: CreditCard, bg: 'bg-success/10', text: 'text-success' };
      case 'MESSAGE': return { icon: MessageSquare, bg: 'bg-primary/10', text: 'text-primary' };
      case 'OFFER': return { icon: Zap, bg: 'bg-amber-100', text: 'text-amber-600' };
      default: return { icon: Bell, bg: 'bg-muted', text: 'text-muted-foreground' };
    }
  };

  const notifications = data?.pages.flatMap((page) => page?.items || []).filter(Boolean) || [];
  const unreadCount = notifications.filter(n => n && !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on your bookings and account activity</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="text-primary border-primary/20 hover:bg-primary/5 font-bold"
          >
            {markAllAsReadMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            Mark all as read
          </Button>
        )}
      </div>

      {status === 'pending' ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="divide-y divide-border/50">
            {notifications.map((notification) => {
              if (!notification) return null;
              const config = getIcon(notification.type || 'SYSTEM');
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-5 flex gap-4 transition-colors relative group cursor-pointer",
                    !notification.isRead ? "bg-primary/5" : "hover:bg-muted/30"
                  )}
                  onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-2xl shrink-0 flex items-center justify-center",
                    config.bg
                  )}>
                    <config.icon className={cn("h-6 w-6", config.text)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                       <h3 className={cn(
                         "text-sm leading-tight",
                         !notification.isRead ? "font-bold text-foreground" : "text-muted-foreground"
                       )}>
                         {notification.title || 'Notification'}
                       </h3>
                       <span className="text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap pt-0.5">
                         {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : 'recently'}
                       </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message || ''}
                    </p>

                    {notification.link && (
                      <div className="mt-3">
                        <Button variant="link" className="p-0 h-auto text-xs text-primary font-bold hover:no-underline">
                          View details <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                       <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                        <DropdownMenuItem>Mute similar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={ref} className="p-4 flex justify-center">
            {isFetchingNextPage ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : hasNextPage ? (
              <span className="text-sm text-muted-foreground">Load more</span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="text-center py-24 bg-muted/50 rounded-2xl border-2 border-dashed border-border">
          <div className="h-20 w-20 bg-card rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
             <Bell className="h-10 w-10 text-muted/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground">All caught up!</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            You don&apos;t have any notifications at the moment. We&apos;ll let you know when something important happens.
          </p>
        </div>
      )}
    </div>
  );
}
