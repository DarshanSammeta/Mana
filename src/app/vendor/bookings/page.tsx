"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Phone,
  Mail,
  Receipt,
  Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/vendor/TableSkeleton";
import toast from "react-hot-toast";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";

const tabs = ["All Bookings", "PENDING", "CONFIRMED", "EVENT_COMPLETED", "CANCELLED"];

export default function VendorBookings() {
  const [activeTab, setActiveTab] = useState("All Bookings");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useAuthStore();

  const fetchBookings = async () => {
    try {
      const res = await axios.get("/api/vendor/bookings", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setBookings(res.data);
    } catch (error) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchBookings();
  }, [accessToken]);

  const updateStatus = async (bookingId: string, status: string) => {
    try {
      await axios.patch("/api/vendor/bookings", { bookingId, status }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success(`Booking ${status.toLowerCase()}`);
      fetchBookings();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredBookings = bookings.filter(b => activeTab === "All Bookings" || b.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Your Bookings</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>Total Bookings: {bookings.length}</span>
            <span className="text-border">|</span>
            <button className="text-primary hover:underline flex items-center gap-1">
              Download Booking History <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Utilities Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-3 border border-border rounded-xl shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors",
                        activeTab === tab
                            ? "bg-primary/10 text-primary font-bold border border-primary/20"
                            : "text-muted-foreground hover:bg-muted border border-transparent"
                    )}
                >
                    {tab.replace('_', ' ')}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <input
                    placeholder="Search by ID or customer..."
                    className="pl-8 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-card"
                />
            </div>
        </div>
      </div>

      {/* Bookings Table / List */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                    <tr>
                        <th className="px-6 py-3 font-bold text-[11px] uppercase tracking-wider">Booking ID</th>
                        <th className="px-6 py-3 font-bold text-[11px] uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 font-bold text-[11px] uppercase tracking-wider">Services</th>
                        <th className="px-6 py-3 font-bold text-[11px] uppercase tracking-wider">Schedule</th>
                        <th className="px-6 py-3 font-bold text-[11px] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 font-bold text-[11px] uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 font-bold text-[11px] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                    {loading ? (
                        <TableSkeleton rows={5} columns={7} />
                    ) : filteredBookings.length > 0 ? (
                        <AnimatePresence mode="popLayout">
                            {filteredBookings.map((booking) => (
                                <motion.tr
                                    layout
                                    key={booking.id}
                                    className="hover:bg-muted/30 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-primary hover:underline cursor-pointer">#{booking.bookingNumber}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{booking.user.fullName}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">{booking.user.mobileNumber}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-[200px]">
                                            {booking.bookingitem.map((item: any) => (
                                                <div key={item.id} className="text-xs font-medium text-muted-foreground truncate">
                                                    {item.service.title}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                                                <Calendar className="h-3 w-3 text-muted-foreground/60" />
                                                {format(new Date(booking.eventDate), "dd MMM, yyyy")}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                <MapPin className="h-3 w-3 text-muted-foreground/60" />
                                                {booking.city}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight inline-block",
                                            booking.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                                            booking.status === "CONFIRMED" ? "bg-primary/10 text-primary" :
                                            booking.status === "EVENT_COMPLETED" ? "bg-success/10 text-success" :
                                            "bg-destructive/10 text-destructive"
                                        )}>
                                            {booking.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-foreground">
                                        ₹{booking.totalAmount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {booking.status === "PENDING" && (
                                                <button
                                                    onClick={() => updateStatus(booking.id, "CONFIRMED")}
                                                    className="p-1.5 text-success hover:bg-success/10 rounded transition-all"
                                                    title="Confirm"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            {booking.status === "CONFIRMED" && (
                                                <button
                                                    onClick={() => updateStatus(booking.id, "EVENT_COMPLETED")}
                                                    className="p-1.5 text-primary hover:bg-primary/10 rounded transition-all"
                                                    title="Complete"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            <div className="relative group/menu">
                                                <button className="p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded border border-transparent hover:border-border transition-all">
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                                <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border shadow-lg rounded-xl py-1 hidden group-hover/menu:block z-50">
                                                    <Link href={`/vendor/bookings/${booking.id}`} className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-muted flex items-center gap-2">
                                                        <Receipt className="h-3.5 w-3.5" /> View Details
                                                    </Link>
                                                    {booking.status !== "CANCELLED" && booking.status !== "EVENT_COMPLETED" && (
                                                        <button
                                                            onClick={() => updateStatus(booking.id, "CANCELLED")}
                                                            className="w-full text-left px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/5 flex items-center gap-2"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" /> Cancel Booking
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <tr>
                            <td colSpan={7} className="px-6 py-20">
                                <EmptyState
                                    icon={Inbox}
                                    title="No Bookings Found"
                                    description={activeTab === "All Bookings"
                                        ? "You haven't received any bookings yet. Make sure your services are active and optimized."
                                        : `You don't have any bookings with status "${activeTab.replace('_', ' ')}".`}
                                    actionText={activeTab === "All Bookings" ? "View My Services" : undefined}
                                    actionHref="/vendor/services"
                                />
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Pagination Mock */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4 shadow-sm text-sm">
        <span className="text-muted-foreground">Showing 1 to 4 of {bookings.length} results</span>
        <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-border rounded-lg text-muted-foreground/40 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg font-bold">1</button>
            <button className="px-3 py-1 border border-border rounded-lg hover:bg-muted transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
