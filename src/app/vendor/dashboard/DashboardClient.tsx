"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CreditCard,
  ExternalLink,
  MapPin,
  Wallet,
  Calendar,
  Clock,
  Plus,
  TrendingUp,
  Sparkles,
  Crown,
  BarChart3,
  Package,
  Users
} from "lucide-react";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";
import { formatSafe } from "@/lib/utils/date";
import toast from "react-hot-toast";
import UpgradeModal from "@/components/vendor/UpgradeModal";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted/20 animate-pulse rounded-2xl" />
});
const AreaChart = dynamic(() => import("recharts").then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });

import {
  VendorStats,
  VendorSubscription,
  VendorAssignment,
  VendorUsage
} from "@/types";
import { vendorService } from "@/services/client";
import { OperationalStats } from "@/components/vendor/OperationalStats";
import { BookingCalendarWidget } from "@/components/vendor/BookingCalendarWidget";
import { VendorTeamBuilder } from "@/components/vendor/VendorTeamBuilder";
import { OperationalQueue } from "@/components/vendor/OperationalQueue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardClientProps {
  initialStats: VendorStats | null;
  initialSubscription: {
    currentSubscription: VendorSubscription;
    usage: VendorUsage;
  } | null;
  initialAssignments: VendorAssignment[];
  initialRecentBookings: VendorAssignment['booking'][];
  accessToken?: string;
}

import { useAuthStore } from "@/store/authStore";

export default function DashboardClient({
  initialStats,
  initialSubscription,
  initialAssignments,
  initialRecentBookings
}: DashboardClientProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [assignments, setAssignments] = useState(initialAssignments);

  const assignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, action }: { assignmentId: string, action: 'ACCEPT' | 'REJECT' }) => {
      return vendorService.handleAssignment(assignmentId, action);
    },

    onSuccess: (_, variables) => {
      toast.success(`Request ${variables.action === 'ACCEPT' ? 'accepted' : 'rejected'}`);
      // Optimistic update or just refetch
      setAssignments(prev => prev.filter(a => a.id !== variables.assignmentId));
      queryClient.invalidateQueries({ queryKey: ["vendor-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process request");
    }
  });

  const handleAssignment = (assignmentId: string, action: 'ACCEPT' | 'REJECT') => {
    assignmentMutation.mutate({ assignmentId, action });
  };

  const stats = initialStats ? [
    {
      label: "Total Revenue",
      value: initialStats.totalRevenue,
      prefix: "₹",
      icon: TrendingUp,
      change: "+12.5%",
      isPositive: true,
      color: "text-primary"
    },
    {
      label: "Total Bookings",
      value: initialStats.totalBookings,
      prefix: "",
      icon: Calendar,
      change: "+3",
      isPositive: true,
      color: "text-accent"
    },
    {
      label: "Withdrawable",
      value: initialStats.withdrawableRevenue,
      prefix: "₹",
      icon: Wallet,
      change: "Ready to pay",
      isPositive: true,
      color: "text-success"
    },
    {
      label: "Monthly Earnings",
      value: initialStats.monthlyRevenue,
      prefix: "₹",
      icon: CreditCard,
      change: "+8.2%",
      isPositive: true,
      color: "text-secondary"
    }
  ] : [];

  const chartData = initialStats?.dailyRevenue.map((item) => ({
    name: formatSafe(item.date, "MMM dd"),
    revenue: item.amount
  })) || [];

  const { currentSubscription, usage } = initialSubscription || {};

  const todayBookings = initialRecentBookings.filter(booking => {
    const eventDate = new Date(booking.eventDate);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString() && booking.status !== 'EVENT_COMPLETED' && booking.status !== 'CANCELLED';
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto px-4 sm:px-0 pb-20"
    >
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Premium Analytics"
        description="Detailed analytics and performance metrics are available on Pro and Premium plans."
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight italic uppercase leading-none">Seller Central</h1>
            {isMounted && (
              <Badge className={cn(
                "rounded-full px-4 py-1.5 font-black text-[10px] tracking-widest border-2",
                user?.verificationStatus === 'APPROVED' ? "bg-green-50 text-green-600 border-green-100" :
                user?.verificationStatus === 'SUSPENDED' ? "bg-red-50 text-red-600 border-red-100" :
                "bg-amber-50 text-amber-600 border-amber-100"
              )}>
                {user?.verificationStatus || 'PENDING'}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 font-black uppercase tracking-[0.2em]">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> India</span>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-1.5 text-primary hover:opacity-80 transition-colors cursor-pointer">
              <span>Your Storefront</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link href="/vendor/services" className="w-full sm:w-auto">
              <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest gap-2">
                  <Plus className="h-4 w-4" /> Add Service
              </Button>
            </Link>
        </div>
      </div>

      {/* 1. Operational Overview (New) */}
      <OperationalStats />

      {/* 2. Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-14 w-fit border border-slate-100">
            <TabsTrigger value="overview" className="rounded-xl px-8 font-black uppercase tracking-widest h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-xl px-8 font-black uppercase tracking-widest h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Requests</TabsTrigger>
            <TabsTrigger value="operations" className="rounded-xl px-8 font-black uppercase tracking-widest h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Operations</TabsTrigger>
            <TabsTrigger value="team" className="rounded-xl px-8 font-black uppercase tracking-widest h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Active/Urgent */}
                <div className="lg:col-span-8 space-y-8">
                    {todayBookings.length > 0 && (
                        <GlassCard className="bg-rose-500 rounded-[2rem] p-6 text-white relative overflow-hidden">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center animate-pulse">
                                        <Clock className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight italic">{todayBookings.length} Events Live Today!</h3>
                                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Execution monitoring active</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    {todayBookings.map((booking) => (
                                        <Link key={booking.id} href={`/vendor/bookings/${booking.id}`}>
                                            <Button variant="secondary" className="rounded-xl font-black uppercase tracking-widest h-11 px-6 shadow-xl">
                                                Track ME-{(booking as any).bookingNumber}
                                            </Button>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {assignments.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">New Booking Requests ({assignments.length})</h2>
                            </div>
                            <div className="grid gap-4">
                                {assignments.map((assignment) => (
                                    <GlassCard key={assignment.id} className="p-6 hover:shadow-xl transition-all border-amber-100">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-black text-slate-900">ME-{assignment.booking.bookingNumber}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md text-slate-500">{assignment.booking.customerprofile?.user?.fullName || "Guest"}</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                    {assignment.booking.bookingitem.map((item) => item.service.title).join(", ")}
                                                </p>
                                                <div className="flex items-center gap-4 pt-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {formatSafe(assignment.booking.eventDate, "PPP")}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {assignment.booking.city}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right mr-4">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Est. Payout</p>
                                                    <p className="text-2xl font-black text-emerald-600 italic">₹{assignment.booking.totalAmount.toLocaleString()}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button onClick={() => handleAssignment(assignment.id, 'ACCEPT')} className="rounded-xl h-12 px-6">Accept</Button>
                                                    <Button variant="outline" onClick={() => handleAssignment(assignment.id, 'REJECT')} className="rounded-xl h-12 px-6">Reject</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Quick Stats Summary Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stats.slice(0, 4).map((stat, i) => (
                                <GlassCard key={i} className="p-4 sm:p-5 hover:border-primary/30 transition-all group overflow-hidden">
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate mr-2">{stat.label}</p>
                                        <stat.icon className={`h-3.5 w-3.5 flex-shrink-0 ${stat.color}`} />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black text-slate-900 italic tracking-tighter truncate">
                                            {stat.prefix}<CountUp end={stat.value} duration={1} separator="," />
                                        </span>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                        <BookingCalendarWidget />
                    </div>
                </div>

                {/* Right: Membership & Performance */}
                <div className="lg:col-span-4 space-y-8">
                     <GlassCard className="p-6 border-slate-900 bg-slate-900 text-white overflow-hidden relative">
                         <Crown className="absolute -right-4 -top-4 h-32 w-32 opacity-10 -rotate-12" />
                         <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-2 bg-white/10 rounded-xl"><Sparkles className="h-5 w-5 text-yellow-400" /></div>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-slate-900 px-3 py-1 rounded-full">{currentSubscription?.subscriptionplan?.name || 'FREE'} PLAN</span>
                            </div>
                            <h4 className="text-xl font-black uppercase italic tracking-tight">Active Membership</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Valid until {formatSafe(currentSubscription?.endDate, "MMM dd")}</p>

                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span>Listing Limit</span>
                                    <span>{usage?.services} / {usage?.limit === -1 ? '∞' : usage?.limit}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400" style={{ width: `${usage?.limit === -1 ? 100 : ((usage?.services || 0) / (usage?.limit || 1)) * 100}%` }} />
                                </div>
                                <Button variant="secondary" className="w-full rounded-xl font-black uppercase tracking-widest mt-4 h-11" onClick={() => (window.location.href="/vendor/subscription")}>Upgrade</Button>
                            </div>
                         </div>
                     </GlassCard>

                     <GlassCard className="p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-black uppercase tracking-widest italic">Performance Metrics</h3>
                        </div>
                        {[
                            { label: "Acceptance Rate", value: 94, color: "bg-emerald-500" },
                            { label: "Completion Rate", value: 98, color: "bg-blue-500" },
                            { label: "Response Time", value: "24m", sub: "Avg per lead", color: "bg-indigo-500" }
                        ].map((m, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">{m.label}</span>
                                    <span className="text-slate-900">{m.value}{typeof m.value === 'number' ? '%' : ''}</span>
                                </div>
                                <div className="h-1 w-full bg-slate-100 rounded-full">
                                    <div className={cn("h-full rounded-full", m.color)} style={{ width: typeof m.value === 'number' ? `${m.value}%` : '100%' }} />
                                </div>
                            </div>
                        ))}
                     </GlassCard>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="requests" className="animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black italic uppercase">Booking Requests</h2>
                    <Badge variant="outline" className="rounded-full px-4 py-1 font-black text-[10px] tracking-widest border-2">SLA: 24 Hours</Badge>
                </div>
                {assignments.filter(a => a.status === 'PENDING').length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                        <p className="font-black text-slate-400 uppercase tracking-widest">No new requests at the moment</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {assignments.filter(a => a.status === 'PENDING').map((assignment) => (
                            <GlassCard key={assignment.id} className="p-8 hover:shadow-2xl transition-all border-amber-100/50 group">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 bg-slate-100 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                            <Package className="h-10 w-10 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-2xl font-black text-slate-900 tracking-tight">ME-{assignment.booking.bookingNumber}</span>
                                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-black text-[9px] uppercase tracking-widest">New Request</Badge>
                                            </div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                                                {assignment.booking.bookingitem.map((item: any) => item.service.title).join(", ")}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-6">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatSafe(assignment.booking.eventDate, "PPP")}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {assignment.booking.city}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {assignment.booking.guestCount} Guests
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="text-center sm:text-right sm:mr-6">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Payout</p>
                                            <p className="text-3xl font-black text-emerald-600 italic tracking-tighter">₹{Number(assignment.booking.totalAmount).toLocaleString()}</p>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button onClick={() => handleAssignment(assignment.id, 'ACCEPT')} className="flex-1 sm:flex-none rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] bg-primary hover:bg-blue-700 shadow-xl shadow-primary/20">Accept</Button>
                                            <Link href={`/vendor/bookings/${assignment.booking.id}`} className="flex-1 sm:flex-none">
                                                <Button variant="outline" className="w-full rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] border-slate-200">View Details</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </TabsContent>

        <TabsContent value="operations" className="animate-in fade-in slide-in-from-bottom-4 duration-400">
            <OperationalQueue initialRecentBookings={initialRecentBookings} />
        </TabsContent>

        <TabsContent value="team" className="animate-in fade-in slide-in-from-bottom-4 duration-400">
            <VendorTeamBuilder />
        </TabsContent>

        <TabsContent value="analytics" className="animate-in fade-in slide-in-from-bottom-4 duration-400">
            {/* Charts section already exists in DashboardClient */}
            <div className="grid grid-cols-1 gap-8">
                 <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-8">
                         <div>
                            <h3 className="text-lg font-black uppercase italic tracking-tight">Revenue Trends</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Earnings for last 30 days</p>
                         </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6C3CF0" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6C3CF0" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} tickFormatter={(value) => `₹${value/1000}k`} />
                                <Tooltip />
                                <Area type="monotone" dataKey="revenue" stroke="#6C3CF0" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                 </GlassCard>
            </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
