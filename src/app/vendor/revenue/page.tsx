"use client";

import {
  Download,
  ArrowUpRight,
  Briefcase,
  Wallet,
  ShieldCheck,
  BarChart3,
  PieChart as PieChartIcon,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/vendor/TableSkeleton";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });

const monthlyData = [
  { month: "Jan", revenue: 45000, commission: 4500 },
  { month: "Feb", revenue: 52000, commission: 5200 },
  { month: "Mar", revenue: 48000, commission: 4800 },
  { month: "Apr", revenue: 61000, commission: 6100 },
  { month: "May", revenue: 55000, commission: 5500 },
  { month: "Jun", revenue: 67000, commission: 6700 },
];

const categoryData = [
  { name: "Photography", value: 45, color: "#2563EB" },
  { name: "Videography", value: 30, color: "#1E293B" },
  { name: "Drone", value: 15, color: "#3B82F6" },
  { name: "Editing", value: 10, color: "#64748B" },
];

const transactions = [
  { id: "TX-9901", type: "Booking Revenue", amount: "₹45,000", commission: "-₹4,500", net: "₹40,500", date: "16 Jun 2024", status: "Settled" },
  { id: "TX-9902", type: "Booking Revenue", amount: "₹12,000", commission: "-₹1,200", net: "₹10,800", date: "15 Jun 2024", status: "Pending" },
  { id: "TX-9895", type: "Booking Revenue", amount: "₹25,000", commission: "-₹2,500", net: "₹22,500", date: "14 Jun 2024", status: "Settled" },
];

export default function VendorRevenue() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revenue Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed breakdown of your marketplace sales and earnings.</p>
        </div>
        <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-1.5 border border-border rounded text-xs font-bold text-muted-foreground hover:bg-muted/50 shadow-sm transition-all">
                <Download className="h-3.5 w-3.5" /> Export PDF
            </button>
            <button className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded text-xs font-bold hover:bg-primary/90 shadow-sm transition-all">
                <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="p-5 bg-card border border-border rounded shadow-sm">
              <Skeleton className="h-3 w-24 mb-4" />
              <Skeleton className="h-10 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))
        ) : (
          <>
            <div className="p-5 bg-card border border-border rounded shadow-sm group hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Gross Revenue</p>
                    <Briefcase className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">₹<CountUp end={842900} duration={1} separator="," /></h2>
                <div className="flex items-center gap-1 mt-2 text-[11px] text-success font-bold">
                    <ArrowUpRight className="h-3 w-3" /> +12.4% vs last month
                </div>
            </div>

            <div className="p-5 bg-card border border-border rounded shadow-sm hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Platform Fees</p>
                    <ShieldCheck className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">₹<CountUp end={84290} duration={1} separator="," /></h2>
                <p className="text-[11px] text-muted-foreground mt-2 font-medium">Avg. Commission: 10%</p>
            </div>

            <div className="p-5 bg-primary text-primary-foreground border border-primary/20 rounded shadow-xl group">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-primary-foreground/70 uppercase tracking-widest">Net Profit</p>
                    <Wallet className="h-4 w-4 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-bold">₹<CountUp end={758610} duration={1} separator="," /></h2>
                <p className="text-[11px] text-primary-foreground/70 mt-2">Available for withdrawal</p>
            </div>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground/50" /> Revenue Growth (Last 6 Months)
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Gross</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-accent" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Fees</span>
                    </div>
                </div>
            </div>
            <div className="p-6">
                {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                ) : (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val/1000}k`} />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{
                                        fontSize: '12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        backgroundColor: '#ffffff'
                                    }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={32} />
                                <Bar dataKey="commission" fill="#64748B" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>

        <div className="bg-card border border-border rounded shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-muted-foreground/50" /> Revenue by Category
                </h2>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-[180px] w-[180px] rounded-full mx-auto" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                ) : (
                    <>
                        <div className="h-[180px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            fontSize: '11px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <p className="text-2xl font-black text-foreground">100%</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Share</p>
                            </div>
                        </div>
                        <div className="mt-6 space-y-2">
                            {categoryData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-bold text-muted-foreground">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-foreground">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* Transactions Table (Amazon Style) */}
      <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Financial Transaction Statement</h2>
                <div className="flex items-center gap-2">
                    <button className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                        View Statement History <ExternalLink className="h-3 w-3" />
                    </button>
                </div>
            </div>
            {loading ? (
                <TableSkeleton rows={5} columns={7} />
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                                <tr>
                                    <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-wider">Transaction ID</th>
                                    <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-wider">Gross Amount</th>
                                    <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-wider">Platform Fee</th>
                                    <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-wider">Net Earned</th>
                                    <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {transactions.map((tx, i) => (
                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-bold text-muted-foreground">{tx.id}</span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-foreground">{tx.type}</td>
                                        <td className="px-6 py-4 font-bold text-foreground">{tx.amount}</td>
                                        <td className="px-6 py-4 font-bold text-accent">{tx.commission}</td>
                                        <td className="px-6 py-4 font-black text-success">{tx.net}</td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground font-medium">{tx.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight border",
                                                tx.status === "Settled" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
                                            )}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-border bg-muted/30 text-center">
                        <button className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1 mx-auto">
                            Load more transactions <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                </>
            )}
      </div>

      {/* Platform Info */}
      <div className="bg-muted/50 border border-border rounded-lg p-6 flex gap-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
              <p className="font-bold text-foreground text-sm mb-1">About Payouts & Commission</p>
              Mana Events charges a standard 10% platform commission on all booking totals. This covers payment processing,
              escrow protection, and customer acquisition. Net earnings are settled to your wallet 48 hours after service
              completion is confirmed by the client.
          </div>
      </div>
    </div>
  );
}
