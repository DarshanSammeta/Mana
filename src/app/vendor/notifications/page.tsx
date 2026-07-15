"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Filter,
  Calendar,
  CreditCard,
  Star,
  AlertCircle,
  MessageSquare,
  Shield,
  Loader2,
  BellOff,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notificationService } from "@/services/client";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const NOTIF_ICONS: Record<string, any> = {
    BOOKING: { icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
    PAYMENT: { icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    REVIEW: { icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
    CHAT: { icon: MessageSquare, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    SYSTEM: { icon: Shield, color: "text-purple-500", bg: "bg-purple-500/10" },
    MARKETING: { icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" }
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async (cursor?: string) => {
    try {
      const data = await notificationService.getNotifications(20, cursor);
      if (cursor) {
          setNotifications(prev => [...prev, ...(Array.isArray(data.items) ? data.items.filter(Boolean) : [])]);
      } else {
          setNotifications(Array.isArray(data.items) ? data.items.filter(Boolean) : []);
      }
      setNextCursor(data.nextCursor);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
      try {
          await notificationService.markAsRead(id);
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      } catch {
          console.error("Failed to mark as read");
      }
  };

  const handleMarkAllRead = async () => {
      setMarkingAll(true);
      try {
          await notificationService.markAllAsRead();
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          toast.success("All caught up!");
      } catch {
          toast.error("Failed to update notifications");
      } finally {
          setMarkingAll(false);
      }
  };

  const handleDelete = async (id: string) => {
      try {
          await notificationService.deleteNotification(id);
          setNotifications(prev => prev.filter(n => n.id !== id));
          toast.success("Notification removed");
      } catch {
          toast.error("Failed to delete notification");
      }
  };

  const handleDeleteAll = async () => {
      if (!confirm("Are you sure you want to clear all notifications?")) return;
      try {
          await notificationService.deleteAllNotifications();
          setNotifications([]);
          toast.success("All notifications cleared");
      } catch {
          toast.error("Failed to clear notifications");
      }
  };

  if (loading) {
      return (
          <div className="flex h-[60vh] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="space-y-10 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2 font-medium">Stay updated with your business activity in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button
                variant="outline"
                className="rounded-2xl px-6 font-bold h-12 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100"
                onClick={handleDeleteAll}
                disabled={notifications.length === 0}
            >
                Clear All
            </Button>
            <Button
                variant="secondary"
                className="rounded-2xl px-6 font-bold h-12"
                onClick={handleMarkAllRead}
                disabled={markingAll || notifications.every(n => n.isRead)}
            >
                {markingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Mark all as read
            </Button>
            <Button variant="secondary" className="p-3 rounded-2xl h-12 w-12">
                <Filter className="h-5 w-5 text-muted-foreground" />
            </Button>
        </div>
      </div>

      <div className="space-y-4">
          {notifications.length === 0 ? (
              <div className="py-24 text-center bg-card rounded-[3rem] border border-dashed border-border/50">
                  <div className="h-20 w-20 bg-secondary/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                      <BellOff className="h-10 w-10 text-muted-foreground opacity-20" />
                  </div>
                  <h3 className="text-xl font-black">All clear!</h3>
                  <p className="text-muted-foreground font-bold mt-1">You don&apos;t have any notifications at the moment.</p>
              </div>
          ) : (
              <>
                {notifications.map((notif, i) => {
                    if (!notif) return null;
                    const config = NOTIF_ICONS[notif.category] || NOTIF_ICONS.SYSTEM;
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={notif.id}
                            onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                            className={cn(
                                "p-6 rounded-[32px] border transition-all flex items-start gap-6 group cursor-pointer",
                                notif.isRead ? "bg-card/50 border-border/30 opacity-80" : "bg-white border-primary/20 shadow-xl shadow-primary/5"
                            )}
                        >
                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform", config.bg)}>
                                <config.icon className={cn("h-7 w-7", config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-lg font-black truncate">{notif.title || 'Notification'}</h3>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap ml-4">
                                        {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : 'just now'}
                                    </span>
                                </div>
                                <p className="text-muted-foreground font-medium leading-relaxed">{notif.message || ''}</p>

                                {notif.link && (
                                    <div className="mt-4 flex gap-3">
                                        <a
                                            href={notif.link}
                                            className="px-6 py-2.5 rounded-xl bg-secondary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all inline-block"
                                        >
                                            Take Action
                                        </a>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                {!notif.isRead && <div className="h-3 w-3 rounded-full bg-primary" />}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(notif.id);
                                    }}
                                    className="p-2 rounded-xl hover:bg-rose-50 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}

                {nextCursor && (
                    <button
                        onClick={() => fetchNotifications(nextCursor)}
                        className="w-full py-8 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
                    >
                        Load Older Notifications
                    </button>
                )}
              </>
          )}
      </div>
    </div>
  );
}
