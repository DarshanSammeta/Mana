"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Package,
  MapPin,
  Clock,
  MoreVertical,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { customerService } from "@/services/client";
import { toast } from "react-hot-toast";

import { formatCurrency, formatDate } from "@/utils/format";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  const tabs = [
    { label: "All Bookings", value: "ALL" },
    { label: "Ongoing", value: "ONGOING" },
    { label: "Completed", value: "EVENT_COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customerService.getBookings({
        status: activeTab === "ALL" ? undefined : activeTab
      });
      // Ensure data is an array, handling various potential wrapper structures
      const bookingsData = Array.isArray(data) ? data : (data?.bookings || data?.items || data?.data || []);
      setBookings(bookingsData);
    } catch (error) {
      console.error("Fetch bookings error:", error);
      toast.error("Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'EVENT_COMPLETED':
        return { label: 'Completed', color: 'bg-success/10 text-success', icon: CheckCircle2 };
      case 'CANCELLED':
        return { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', icon: XCircle };
      case 'PENDING':
        return { label: 'Waitlist', color: 'bg-amber-100 text-amber-700', icon: Clock };
      case 'CONFIRMED':
        return { label: 'Confirmed', color: 'bg-info/10 text-info', icon: CheckCircle2 };
      default:
        return { label: status.replace(/_/g, ' '), color: 'bg-primary/10 text-primary', icon: RefreshCcw };
    }
  };

  const filteredBookings = bookings.filter(b =>
    b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vendorprofile?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-slate-500 mt-1 font-medium">Track and manage your upcoming and past events.</p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by vendor or booking ID..."
            className="pl-11 h-12 bg-white border-slate-200 rounded-xl focus:ring-primary/20 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-100">
        <div className="flex gap-10">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "pb-4 text-sm font-black transition-all relative uppercase tracking-widest",
                activeTab === tab.value
                  ? "text-primary"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
              {activeTab === tab.value && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-44 w-full rounded-3xl" />
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            const status = getStatusConfig(booking.status);
            return (
              <div key={booking.id} className="group border border-slate-200 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all bg-white">
                {/* Booking Header */}
                <div className="bg-slate-50/80 px-8 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-10">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Placed</p>
                      <p className="text-sm font-black text-slate-700">{formatDate(booking.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="text-sm font-black text-slate-900">{formatCurrency(Number(booking.totalAmount))}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Event Date</p>
                      <p className="text-sm font-black text-slate-700">{formatDate(booking.eventDate, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Booking ID</p>
                      <p className="text-sm font-black text-slate-700">#{booking.bookingNumber}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-200 transition-colors">
                          <MoreVertical className="h-5 w-5 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-slate-200 p-2 shadow-xl">
                        <DropdownMenuItem asChild className="rounded-lg font-bold text-slate-700 cursor-pointer focus:bg-primary focus:text-white">
                          <Link href={`/customer/bookings/${booking.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg font-bold text-slate-700 cursor-pointer focus:bg-primary focus:text-white">Download Invoice</DropdownMenuItem>
                        {booking.status === 'EVENT_COMPLETED' && (
                          <DropdownMenuItem className="rounded-lg font-black text-primary cursor-pointer focus:bg-primary focus:text-white">Write Review</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Booking Content */}
                <div className="p-8 flex flex-col md:flex-row gap-8">
                  <div className="h-28 w-28 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-primary/20 transition-all overflow-hidden shadow-inner relative">
                    {booking.vendorprofile?.logo ? (
                      <Image
                        src={booking.vendorprofile.logo}
                        alt={booking.vendorprofile.businessName || 'Vendor'}
                        fill
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        sizes="112px"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors tracking-tight">{booking.vendorprofile?.businessName || 'Vendor Profile Pending'}</h3>
                          <p className="text-sm text-slate-500 font-bold mt-1.5 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/40"></span>
                            {booking.bookingitem.map((it: any) => it.service.title).join(", ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                              <MapPin className="h-4 w-4 text-primary/60" />
                              {booking.city}, {booking.state}
                           </div>
                           <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                              <Clock className="h-4 w-4 text-primary/60" />
                              {booking.eventTime || "TBA"}
                           </div>
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 shrink-0">
                        <Badge className={cn("px-5 py-2 font-black text-[10px] uppercase tracking-widest rounded-full border-none shadow-sm", status.color)}>
                          <status.icon className="h-3 w-3 mr-2" />
                          {status.label}
                        </Badge>
                        <div className="lg:mt-6">
                           <Link href={`/customer/bookings/${booking.id}`}>
                             <Button className="h-12 px-8 font-black text-xs bg-primary hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-primary/20">
                               TRACK STATUS
                             </Button>
                           </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Quick Action */}
                {booking.status === 'PENDING' && (
                   <div className="px-8 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-xs text-amber-700 font-bold">Awaiting vendor confirmation. Usually confirmed within 4 hours.</p>
                   </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <div className="h-20 w-20 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-6">
             <Package className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">No bookings found</h3>
          <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">Discover professional event services and start planning your next big moment.</p>
          <Link href="/marketplace">
            <Button className="mt-8 bg-primary hover:bg-blue-700 text-white font-extrabold rounded-2xl px-10 py-6 h-auto shadow-xl shadow-primary/20">
              Browse Marketplace
            </Button>
          </Link>
        </div>
      )}

    </div>
  );
}
