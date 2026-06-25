"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Search,
  Filter,
  ChevronRight,
  Package,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  MoreVertical,
  ExternalLink,
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

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let url = "/api/customer/bookings";
      if (activeTab !== "ALL") {
        url += `?status=${activeTab}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

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
    b.vendorprofile.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-slate-500 mt-1 font-medium">Track and manage your upcoming and past events.</p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by vendor or booking ID..."
            className="pl-11 h-12 bg-white border-slate-200 rounded-2xl focus:ring-primary/20 transition-all shadow-sm"
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
                "pb-4 text-sm font-bold transition-all relative",
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
              <div key={booking.id} className="group border border-slate-200 rounded-3xl overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all bg-white">
                {/* Booking Header */}
                <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-10">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Placed</p>
                      <p className="text-sm font-bold text-slate-700">{format(new Date(booking.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                      <p className="text-sm font-bold text-slate-700">₹{Number(booking.totalAmount).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Date</p>
                      <p className="text-sm font-bold text-slate-700">{format(new Date(booking.eventDate), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking ID</p>
                      <p className="text-sm font-bold text-slate-700">#{booking.bookingNumber}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                          <MoreVertical className="h-5 w-5 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-slate-200 p-2">
                        <DropdownMenuItem asChild className="rounded-lg font-medium cursor-pointer">
                          <Link href={`/customer/bookings/${booking.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg font-medium cursor-pointer">Download Invoice</DropdownMenuItem>
                        {booking.status === 'EVENT_COMPLETED' && (
                          <DropdownMenuItem className="rounded-lg font-bold text-primary cursor-pointer">Write Review</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Booking Content */}
                <div className="p-8 flex flex-col md:flex-row gap-8">
                  <div className="h-24 w-24 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-primary/20 transition-colors overflow-hidden">
                    {booking.vendorprofile.logo ? (
                      <img src={booking.vendorprofile.logo} alt={booking.vendorprofile.businessName} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-10 w-10 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-primary transition-colors">{booking.vendorprofile.businessName}</h3>
                          <p className="text-sm text-slate-500 font-medium mt-1">
                            {booking.bookingitem.map((it: any) => it.service.title).join(", ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              {booking.city}, {booking.state}
                           </div>
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <Clock className="h-4 w-4 text-slate-400" />
                              {booking.eventTime || "TBA"}
                           </div>
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 shrink-0">
                        <Badge className={cn("px-4 py-1.5 font-black text-[10px] uppercase tracking-widest rounded-full border-none shadow-sm", status.color)}>
                          <status.icon className="h-3 w-3 mr-2" />
                          {status.label}
                        </Badge>
                        <div className="lg:mt-4">
                           <Link href={`/customer/bookings/${booking.id}`}>
                             <Button variant="outline" className="h-10 px-6 font-black text-xs border-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl transition-all">
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
