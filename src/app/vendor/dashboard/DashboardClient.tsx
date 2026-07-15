"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CreditCard,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Clock,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  MapPin,
  Check,
  X,
  Wallet,
  Sparkles,
  Crown,
  CheckCircle2 as CheckCircleIcon,
  BarChart3,
  Inbox,
  Calendar,
  Bell,
  TrendingUp
} from "lucide-react";
import CountUp from "react-countup";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";
import UpgradeModal from "@/components/vendor/UpgradeModal";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import dynamic from "next/dynamic";

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

// Simple ProgressBar for local use
const ProgressBar = ({ value, colorClass }: { value: number, colorClass?: string }) => (
  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
    <div className={`h-full transition-all duration-500 ${colorClass || 'bg-primary'}`} style={{ width: `${value}%` }} />
  </div>
);

import {
  VendorStats,
  VendorSubscription,
  VendorAssignment,
  VendorUsage
} from "@/types";
import { vendorService } from "@/services/client";

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

export default function DashboardClient({
  initialStats,
  initialSubscription,
  initialAssignments,
  initialRecentBookings
}: DashboardClientProps) {
  const queryClient = useQueryClient();
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
    name: format(new Date(item.date), "MMM dd"),
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
      className="space-y-6 max-w-7xl mx-auto px-4 sm:px-0"
    >
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Premium Analytics"
        description="Detailed analytics and performance metrics are available on Pro and Premium plans."
      />

      {/* Live Event Banner */}
      {todayBookings.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="bg-rose-500 rounded-2xl p-4 md:p-6 text-white shadow-lg shadow-rose-200 overflow-hidden relative"
        >
          <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 -skew-x-12 translate-x-12" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">You have {todayBookings.length} event{todayBookings.length > 1 ? 's' : ''} today!</h3>
                <p className="text-white/80 text-xs font-bold">Manage your live bookings and update status in real-time.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {todayBookings.map((booking) => (
                <Link key={booking.id} href={`/vendor/bookings/${booking.id}`} className="flex-1 md:flex-none">
                  <button className="w-full px-6 py-2.5 bg-white text-rose-500 rounded-xl text-xs font-black hover:bg-rose-50 transition-colors uppercase tracking-widest shadow-sm">
                    View #{booking.bookingNumber}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight">Seller Central</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Marketplace: India</span>
            <span className="hidden sm:inline text-border">|</span>
            <div className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors cursor-pointer font-bold">
              <span>View your storefront</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link href="/vendor/reports" className="w-full sm:w-auto">
              <button className="w-full px-5 py-3 rounded-xl bg-card border border-border text-sm font-bold hover:bg-muted shadow-sm transition-all text-foreground">
                  Download Reports
              </button>
            </Link>
            <Link href="/vendor/services" className="w-full sm:w-auto">
              <button className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                  Add New Service
              </button>
            </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Column: Core Stats & Sales */}
        <div className="lg:col-span-3 space-y-6">

          {/* Incoming Requests Panel (Smart Match) */}
          {assignments.length > 0 && (
            <div className="bg-cta/5 border-2 border-cta/20 rounded-2xl shadow-xl shadow-cta/5 overflow-hidden">
              <div className="p-4 bg-cta/10 border-b border-cta/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cta" />
                  <h2 className="text-xs md:text-sm font-black text-cta uppercase tracking-widest">New Booking Requests ({assignments.length})</h2>
                </div>
                <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-tighter bg-cta px-3 py-1 rounded-full shadow-lg shadow-cta/20">Action Required</span>
              </div>
              <div className="divide-y divide-cta/10">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 md:p-5 hover:bg-cta/5 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-foreground">#{assignment.booking.bookingNumber}</span>
                          <span className="text-xs font-bold text-muted-foreground">• {assignment.booking.user.fullName}</span>
                        </div>
                        <p className="text-sm font-bold text-foreground/80 line-clamp-1">
                          {assignment.booking.bookingitem.map((item) => item.service.title).join(", ")}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {format(new Date(assignment.booking.eventDate), "PPP")}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {assignment.booking.city}, {assignment.booking.state}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="text-left sm:text-right sm:mr-6">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Est. Payout</p>
                          <p className="text-xl md:text-2xl font-black text-success">₹{assignment.booking.totalAmount}</p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAssignment(assignment.id, 'ACCEPT')}
                            disabled={assignmentMutation.isPending}
                            className="flex-1 px-6 py-3.5 bg-success text-white text-xs font-black rounded-xl hover:bg-success/90 shadow-lg shadow-success/20 flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" /> Accept
                          </button>
                          <button
                            onClick={() => handleAssignment(assignment.id, 'REJECT')}
                            disabled={assignmentMutation.isPending}
                            className="flex-1 px-6 py-3.5 bg-card border border-border text-foreground text-xs font-black rounded-xl hover:bg-muted shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                          >
                            <X className="h-4 w-4" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-card p-5 border border-border rounded-2xl shadow-sm hover:border-primary/30 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <div className={`p-2 rounded-xl transition-colors ${stat.color?.replace('text-', 'bg-')}/10 group-hover:bg-primary group-hover:text-white`}>
                    <stat.icon className={`h-4 w-4 ${stat.color} group-hover:text-white transition-colors`} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground tracking-tight">
                    {stat.prefix}<CountUp end={stat.value} duration={1} separator="," />
                  </span>
                </div>
                <div className={`text-[10px] mt-3 flex items-center gap-1 font-black uppercase tracking-widest ${stat.isPositive ? 'text-success' : 'text-destructive'}`}>
                   {stat.isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                   <span>{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sales Chart Card */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Sales Summary</h2>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </div>
              <div className="flex gap-2">
                {['7D', '30D', '1Y'].map(t => (
                   <button key={t} className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${t === '7D' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}>
                     {t}
                   </button>
                ))}
              </div>
            </div>
            <div className="p-6">
              <div className="h-[300px] w-full relative">
                {(currentSubscription?.subscriptionplan?.rank ?? 0) < 1 ? (
                  <div className="absolute inset-0 z-10 bg-card/40 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                    <div className="bg-card border border-border p-6 rounded-2xl shadow-xl max-w-[240px]">
                      <AlertCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                      <p className="text-xs font-black text-foreground uppercase tracking-widest mb-1">Analytics Locked</p>
                      <p className="text-[10px] text-muted-foreground font-bold mb-4">Upgrade to Starter or Pro to view detailed sales trends.</p>
                      <button
                        onClick={() => setShowUpgrade(true)}
                        className="w-full py-2.5 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-primary/20"
                      >
                        Upgrade Now
                      </button>
                    </div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState
                      icon={BarChart3}
                      title="No Sales Data"
                      description="Start receiving bookings to see your sales performance trends here."
                    />
                  </div>
                ) : null}
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                            tickFormatter={(value) => `₹${value/1000}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                fontSize: '12px',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '16px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                backgroundColor: 'hsl(var(--card))',
                                color: 'hsl(var(--foreground))',
                                fontWeight: 'bold'
                            }}
                            itemStyle={{ color: 'var(--primary)' }}
                            cursor={{ stroke: 'var(--primary)', strokeWidth: 2, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--primary)"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Orders/Bookings Table Style */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
              <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Recent Orders</h2>
              <button className="text-xs text-primary font-black md:hidden hover:underline">View All</button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              {initialRecentBookings.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-bold border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Order ID</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Customer</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Service</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {initialRecentBookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-5">
                          <Link href={`/vendor/bookings/${booking.id}`} className="font-black text-primary group-hover:translate-x-1 transition-transform inline-block">
                            #{booking.bookingNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-5 text-foreground font-bold">{booking.user.fullName}</td>
                        <td className="px-6 py-5 text-muted-foreground font-bold">{booking.bookingitem[0]?.service.title || 'N/A'}</td>
                        <td className="px-6 py-5 font-black text-foreground">{formatCurrency(booking.totalAmount)}</td>
                        <td className="px-6 py-5">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            booking.status === "CONFIRMED" ? "bg-success/10 text-success border-success/20" :
                            booking.status === "PENDING" ? "bg-amber-100 text-amber-700 border-amber-200" :
                            ["VENDOR_TRAVELING", "VENDOR_ARRIVED"].includes(booking.status) ? "bg-blue-100 text-blue-700 border-blue-200" :
                            booking.status === "EVENT_STARTED" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                            booking.status === "EVENT_COMPLETED" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                            "bg-muted text-muted-foreground border-border"
                          )}>
                            {booking.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-20">
                   <EmptyState
                    icon={Inbox}
                    title="No Orders Yet"
                    description="Your recent bookings will appear here once customers start booking your services."
                  />
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
               {initialRecentBookings.length > 0 ? (
                 initialRecentBookings.slice(0, 3).map((booking) => (
                   <Link key={booking.id} href={`/vendor/bookings/${booking.id}`} className="block p-5 space-y-3 hover:bg-muted/30 active:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-xs font-black text-primary">#{booking.bookingNumber}</p>
                            <p className="text-sm font-black text-foreground">{booking.user.fullName}</p>
                         </div>
                         <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            booking.status === "CONFIRMED" ? "bg-success/10 text-success" :
                            ["VENDOR_TRAVELING", "VENDOR_ARRIVED"].includes(booking.status) ? "bg-blue-100 text-blue-700" :
                            booking.status === "EVENT_STARTED" ? "bg-indigo-100 text-indigo-700" :
                            booking.status === "EVENT_COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                            "bg-muted text-muted-foreground"
                         )}>{booking.status.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between items-end">
                         <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider line-clamp-1">{booking.bookingitem[0]?.service.title || 'N/A'}</p>
                         <p className="text-base font-black text-foreground">{formatCurrency(booking.totalAmount)}</p>
                      </div>
                   </Link>
                 ))
               ) : (
                <div className="py-10 px-4">
                  <p className="text-center text-sm text-muted-foreground font-bold">No orders found</p>
                </div>
               )}
            </div>

            <div className="p-4 border-t border-border bg-muted/30 text-center">
              <button className="text-xs font-black text-primary hover:text-primary/80 flex items-center justify-center gap-2 mx-auto uppercase tracking-widest">
                View all orders <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Performance */}
        <div className="space-y-6">

          {/* Subscription Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
              <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Membership</h2>
              <Crown className={`h-5 w-5 ${currentSubscription?.subscriptionplan?.name === 'PREMIUM' ? 'text-accent' : 'text-primary'}`} />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                 <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-foreground">{currentSubscription?.subscriptionplan?.name || 'FREE'} PLAN</p>
                    <p className="text-[10px] text-muted-foreground font-bold">
                      {currentSubscription?.endDate ? `Expires ${format(new Date(currentSubscription.endDate), "MMM dd")}` : 'Upgrade for more features'}
                    </p>
                 </div>
              </div>

              {usage && (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground">Listings</span>
                      <span className="text-foreground">{usage.services} / {usage.limit === -1 ? '∞' : usage.limit}</span>
                  </div>
                  <ProgressBar value={usage.limit === -1 ? 100 : (usage.services / usage.limit) * 100} />
                </div>
              )}

              <Link
                href="/vendor/subscription"
                className="w-full block text-center py-3 rounded-xl bg-card border border-border text-xs font-black hover:bg-muted transition-all uppercase tracking-widest active:scale-95"
              >
                Manage Subscription
              </Link>
            </div>
          </motion.div>

          {/* Seller Performance Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border bg-muted/30">
              <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Account Health</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center border border-success/20 shadow-lg shadow-success/5">
                  <CheckCircleIcon className="h-8 w-8 text-success" />
                </div>
                <div>
                  <p className="text-sm font-black text-success uppercase tracking-widest">Healthy</p>
                  <p className="text-[11px] text-muted-foreground font-bold">Priority Support Enabled</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                {[
                  { label: "Response Rate", value: 98, color: "bg-primary" },
                  { label: "Late Delivery", value: 0, color: "bg-muted", isInverse: true },
                  { label: "Cancellation Rate", value: 1.2, color: "bg-success" }
                ].map((metric, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="text-foreground">{metric.value}{metric.label.includes('Rate') ? '%' : ''}</span>
                    </div>
                    <ProgressBar value={metric.isInverse ? 100 - metric.value : metric.value} colorClass={metric.color} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Payments Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
              <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Payments</h2>
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="p-6">
              <div className="space-y-1.5 mb-6">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Withdrawable Balance</p>
                <p className="text-3xl font-black text-foreground tracking-tight">{formatCurrency(stats.find((s) => s.label === "Withdrawable")?.value || 0)}</p>
                <div className="flex items-center gap-1.5 pt-1">
                   <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                   <p className="text-[10px] text-success font-black uppercase tracking-widest">Ready to Transfer</p>
                </div>
              </div>
              <button className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest active:scale-95">
                Withdraw to Bank
              </button>
            </div>
          </motion.div>

          {/* Notification/News Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
              <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Important Alerts</h2>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-2 divide-y divide-border">
              {[
                { title: "Policy Update", desc: "New seller guidelines for 2024", date: "2h ago", icon: AlertCircle, color: "text-cta" },
                { title: "Review Request", desc: "A client requested a refund for #ME-402", date: "5h ago", icon: Clock, color: "text-primary" }
              ].map((n, i) => (
                <div key={i} className="p-3 hover:bg-muted/50 cursor-pointer group rounded-xl transition-all">
                  <div className="flex gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${n.color.replace('text-', 'bg-')}/10`}>
                      <n.icon className={`h-4 w-4 ${n.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors leading-tight">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground font-bold line-clamp-1 mt-0.5">{n.desc}</p>
                      <p className="text-[9px] text-muted-foreground/60 mt-1 font-bold uppercase tracking-wider">{n.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
