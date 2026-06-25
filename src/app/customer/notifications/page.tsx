"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  Trash2,
  Calendar,
  CreditCard,
  MessageSquare,
  Zap,
  Info,
  Clock,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/customer/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/customer/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/customer/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ readAll: true })
      });
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING': return { icon: Calendar, bg: 'bg-info/10', text: 'text-info' };
      case 'PAYMENT': return { icon: CreditCard, bg: 'bg-success/10', text: 'text-success' };
      case 'MESSAGE': return { icon: MessageSquare, bg: 'bg-primary/10', text: 'text-primary' };
      case 'OFFER': return { icon: Zap, bg: 'bg-amber-100', text: 'text-amber-600' };
      default: return { icon: Bell, bg: 'bg-muted', text: 'text-muted-foreground' };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
            onClick={markAllAsRead}
            className="text-primary border-primary/20 hover:bg-primary/5 font-bold"
          >
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="divide-y divide-border/50">
            {notifications.map((notification) => {
              const config = getIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-5 flex gap-4 transition-colors relative group",
                    !notification.isRead ? "bg-primary/5" : "hover:bg-muted/30"
                  )}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
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
                         {notification.title}
                       </h3>
                       <span className="text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap pt-0.5">
                         {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                       </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
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
        </div>
      ) : (
        <div className="text-center py-24 bg-muted/50 rounded-2xl border-2 border-dashed border-border">
          <div className="h-20 w-20 bg-card rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
             <Bell className="h-10 w-10 text-muted/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground">All caught up!</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            You don't have any notifications at the moment. We'll let you know when something important happens.
          </p>
        </div>
      )}
    </div>
  );
}
