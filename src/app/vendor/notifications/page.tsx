"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Filter,
  MoreVertical,
  Calendar,
  CreditCard,
  Star,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
  {
    id: 1,
    title: "New Booking Received",
    message: "Rohan Sharma has booked 'Premium Wedding Photography' for 24 June, 2026.",
    time: "2 mins ago",
    type: "booking",
    isRead: false,
    icon: Calendar,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    id: 2,
    title: "Payment Settled",
    message: "₹40,500 has been added to your wallet for Booking #BK-8288.",
    time: "4 hours ago",
    type: "payment",
    isRead: false,
    icon: CreditCard,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    id: 3,
    title: "New 5-Star Review!",
    message: "Ananya Iyer left a review: 'Amazing service and very professional team.'",
    time: "1 day ago",
    type: "review",
    isRead: true,
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    id: 4,
    title: "Payout Processing",
    message: "Your withdrawal request for ₹25,000 is being processed by the bank.",
    time: "2 days ago",
    type: "payout",
    isRead: true,
    icon: Clock,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    id: 5,
    title: "Document Expiring",
    message: "Your Business License is expiring in 15 days. Please upload a new one.",
    time: "3 days ago",
    type: "reminder",
    isRead: true,
    icon: AlertCircle,
    color: "text-rose-500",
    bg: "bg-rose-500/10"
  }
];

export default function NotificationCenter() {
  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">Stay updated with your business activity in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="px-6 py-3 rounded-2xl bg-secondary font-bold text-sm hover:bg-secondary/80 transition-all">
                Mark all as read
            </button>
            <button className="p-3 bg-secondary rounded-2xl hover:bg-secondary/80 transition-all">
                <Filter className="h-5 w-5 text-muted-foreground" />
            </button>
        </div>
      </div>

      <div className="max-w-4xl space-y-4">
          {notifications.map((notif, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={notif.id}
                className={cn(
                    "p-6 rounded-[32px] border transition-all flex items-start gap-6 group cursor-pointer",
                    notif.isRead ? "bg-card border-border/50" : "bg-primary/[0.02] border-primary/20 shadow-xl shadow-primary/5"
                )}
              >
                  <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform", notif.bg)}>
                      <notif.icon className={cn("h-7 w-7", notif.color)} />
                  </div>
                  <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-black">{notif.title}</h3>
                          <span className="text-xs font-bold text-muted-foreground">{notif.time}</span>
                      </div>
                      <p className="text-muted-foreground font-medium leading-relaxed">{notif.message}</p>
                      <div className="mt-4 flex gap-3">
                          <button className="px-4 py-2 rounded-xl bg-secondary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">View Details</button>
                          {notif.type === "booking" && (
                            <button className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Accept Booking</button>
                          )}
                      </div>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                      {!notif.isRead && <div className="h-3 w-3 rounded-full bg-primary" />}
                      <button className="p-2 rounded-xl hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-5 w-5 text-muted-foreground" />
                      </button>
                  </div>
              </motion.div>
          ))}

          <button className="w-full py-6 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
              Load Older Notifications
          </button>
      </div>
    </div>
  );
}
