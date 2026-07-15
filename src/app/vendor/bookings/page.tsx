"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  MapPin,
  MessageSquare,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  Receipt,
  Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";
import { vendorService } from "@/services/client";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/vendor/TableSkeleton";
import toast from "react-hot-toast";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";

import { Booking, BookingStatus } from "@/types";

const tabs: (BookingStatus | "All Bookings")[] = ["All Bookings", "PENDING", "CONFIRMED", "EVENT_COMPLETED", "CANCELLED"];

export default function VendorBookings() {
  const [activeTab, setActiveTab] = useState<BookingStatus | "All Bookings">("All Bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const res = await vendorService.getRecentBookings(); // Using recent for now, should be all bookings
      setBookings(res);
    } catch {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      await vendorService.updateBookingStatus(bookingId, status);
      toast.success(`Booking ${status.toLowerCase()}`);
      fetchBookings();
    } catch {
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
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                    <tr>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Booking ID</th>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Customer</th>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Services</th>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Schedule</th>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Amount</th>
                        <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-right">Actions</th>
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
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    key={booking.id}
                                    className="hover:bg-muted/30 transition-colors group"
                                >
                                    <td className="px-6 py-5">
                                        <span className="font-black text-primary hover:underline cursor-pointer group-hover:translate-x-1 transition-transform inline-block">#{booking.bookingNumber}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">{booking.user.fullName}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Phone className="h-3 w-3 text-muted-foreground/60" />
                                                <span className="text-xs text-muted-foreground font-medium">{booking.user.mobileNumber}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="max-w-[200px]">
                                            {booking.bookingitem.map((item: any) => (
                                                <div key={item.id} className="text-xs font-bold text-muted-foreground truncate">
                                                    {item.service.title}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-xs text-foreground font-bold">
                                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                                {format(new Date(booking.eventDate), "dd MMM, yyyy")}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                                                <MapPin className="h-3 w-3 text-muted-foreground/60" />
                                                {booking.eventLocation}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            booking.status === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                            booking.status === "CONFIRMED" ? "bg-primary/5 text-primary border-primary/20" :
                                            booking.status === "EVENT_COMPLETED" ? "bg-success/5 text-success border-success/20" :
                                            "bg-muted text-muted-foreground border-border"
                                        )}>
                                            {booking.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 font-black text-foreground">
                                        ₹{booking.totalAmount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {booking.status === "PENDING" && (
                                                <button
                                                    onClick={() => updateStatus(booking.id, "CONFIRMED")}
                                                    className="p-2 text-success hover:bg-success/10 rounded-lg transition-all active:scale-95 border border-transparent hover:border-success/20"
                                                    title="Confirm"
                                                >
                                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                                </button>
                                            )}
                                            {booking.status === "CONFIRMED" && (
                                                <button
                                                    onClick={() => updateStatus(booking.id, "EVENT_COMPLETED")}
                                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-95 border border-transparent hover:border-primary/20"
                                                    title="Complete"
                                                >
                                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                                </button>
                                            )}
                                            <div className="relative group/menu">
                                                <button className="p-2 text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-lg border border-transparent hover:border-border transition-all">
                                                    <MoreVertical className="h-4.5 w-4.5" />
                                                </button>
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border shadow-xl rounded-xl py-1.5 hidden group-hover/menu:block z-50">
                                                    <Link href={`/vendor/bookings/${booking.id}`} className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-muted flex items-center gap-2.5">
                                                        <Receipt className="h-4 w-4 text-primary" /> View Details
                                                    </Link>
                                                    <button className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-muted flex items-center gap-2.5">
                                                        <MessageSquare className="h-4 w-4 text-primary" /> Message Client
                                                    </button>
                                                    {booking.status !== "CANCELLED" && booking.status !== "EVENT_COMPLETED" && (
                                                        <div className="pt-1.5 mt-1.5 border-t border-border">
                                                            <button
                                                                onClick={() => updateStatus(booking.id, "CANCELLED")}
                                                                className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/5 flex items-center gap-2.5"
                                                            >
                                                                <XCircle className="h-4 w-4" /> Cancel Booking
                                                            </button>
                                                        </div>
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

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-border/50">
            {loading ? (
                 <div className="p-4 space-y-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                 </div>
            ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                    <div key={booking.id} className="p-5 space-y-4 hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">#{booking.bookingNumber}</span>
                                <h3 className="font-black text-foreground mt-0.5">{booking.user.fullName}</h3>
                            </div>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                booking.status === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                booking.status === "CONFIRMED" ? "bg-primary/5 text-primary border-primary/20" :
                                "bg-muted text-muted-foreground border-border"
                            )}>
                                {booking.status.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="space-y-2">
                             <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {format(new Date(booking.eventDate), "PPP")}
                             </div>
                             <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                {booking.eventLocation}
                             </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                             <span className="text-lg font-black text-foreground">₹{booking.totalAmount.toLocaleString('en-IN')}</span>
                             <Link
                                href={`/vendor/bookings/${booking.id}`}
                                className="px-4 py-2 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                             >
                                Details
                             </Link>
                        </div>
                    </div>
                ))
            ) : (
                <div className="py-20 px-4">
                    <EmptyState
                        icon={Inbox}
                        title="No Bookings Found"
                        description="Try adjusting your filters."
                    />
                </div>
            )}
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
