"use client";

import { useQuery } from "@tanstack/react-query";
import { formatSafe } from "@/lib/utils/date";
import {
  Search, ExternalLink
} from "lucide-react";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Tabs, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import apiClient from "@/lib/apiClient";
import { useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";

const STATUS_BADGES: Record<string, string> = {
  VENDOR_REVIEW: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PREPARATION_STARTED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  VENDOR_ASSIGNED: "bg-blue-100 text-blue-700 border-blue-200",
  EVENT_STARTED: "bg-rose-100 text-rose-700 border-rose-200",
  EVENT_COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  BALANCE_PENDING: "bg-orange-100 text-orange-700 border-orange-200",
};

export function OperationalQueue({ initialRecentBookings = [] }: { initialRecentBookings: any[] }) {
    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");

    const { data: bookings } = useQuery({
        queryKey: ["vendor-operational-queue", activeTab, search],
        queryFn: async () => {
            const res = await apiClient.get("/vendor/bookings", {
                params: {
                    status: activeTab === "all" ? undefined : activeTab,
                    query: search || undefined
                }
            });
            return res.data;
        },
        initialData: initialRecentBookings
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-fit">
                    <TabsList className="bg-slate-50 p-1 rounded-xl h-10 border">
                        <TabsTrigger value="all" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4">All</TabsTrigger>
                        <TabsTrigger value="VENDOR_REVIEW" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4">Review</TabsTrigger>
                        <TabsTrigger value="CONFIRMED" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4">Prep</TabsTrigger>
                        <TabsTrigger value="EVENT_STARTED" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4">Live</TabsTrigger>
                        <TabsTrigger value="BALANCE_PENDING" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-4">Payments</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by ID or Customer..."
                        className="pl-10 h-10 rounded-xl border-slate-200 text-xs font-bold"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <GlassCard className="overflow-hidden border-slate-100">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-6">Order</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Event Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-6">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings?.map((booking: any) => {
                            const customerUser = booking.customerprofile?.user;
                            return (
                                <TableRow key={booking.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <TableCell className="py-4 pl-6">
                                        <div className="space-y-1">
                                            <p className="font-black text-slate-900">ME-{booking.bookingNumber}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">
                                                {booking.bookingitem?.[0]?.service?.title || "Operational Service"}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                {customerUser?.fullName?.[0] || "?"}
                                            </div>
                                            <span className="text-xs font-black text-slate-700">{customerUser?.fullName || "Guest"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-black text-slate-900 italic">{formatSafe(booking.eventDate, "MMM d, yyyy")}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{booking.city}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("rounded-md text-[9px] font-black uppercase px-2 py-0.5 border shadow-none", STATUS_BADGES[booking.status] || "bg-slate-50 text-slate-500")}>
                                            {booking.status.replace("_", " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm font-black text-slate-900">{formatCurrency(booking.totalAmount)}</p>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Link href={`/vendor/bookings/${booking.id}`}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg group-hover:bg-primary group-hover:text-white transition-all"
                                                aria-label={`View details for booking ME-${booking.bookingNumber}`}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {(!bookings || bookings.length === 0) && (
                    <div className="py-20 text-center">
                        <p className="text-sm font-black text-slate-400 uppercase italic">No active bookings found</p>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
