"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  Plus,
  CreditCard,
  History,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import CountUp from "react-countup";

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/customer/wallet", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch (error) {
      console.error("Failed to fetch wallet", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Skeleton className="h-32 rounded-2xl" />
           <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mana Wallet</h1>
            <p className="text-slate-500 mt-1 font-medium">Manage your funds, rewards, and transaction history.</p>
         </div>
         <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
            <ShieldCheck className="h-4 w-4" /> Secure & Encrypted
         </div>
      </div>

      {/* Main Balance Card */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl shadow-slate-200">
         <div className="absolute top-0 right-0 p-32 opacity-10 blur-3xl bg-primary rounded-full translate-x-1/2 -translate-y-1/2" />
         <div className="absolute bottom-0 left-0 p-24 opacity-5 blur-3xl bg-emerald-500 rounded-full -translate-x-1/4 translate-y-1/4" />

         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
            <div className="space-y-6">
               <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                  <p className="text-white font-black uppercase tracking-widest text-[10px]">Total Balance</p>
               </div>
               <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-slate-400">₹</span>
                  <h2 className="text-6xl md:text-8xl font-black tracking-tighter">
                     <CountUp end={Number(wallet?.balance || 0)} decimals={2} duration={1.5} />
                  </h2>
               </div>
               <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 border border-emerald-500/20">
                     <TrendingUp className="h-3.5 w-3.5" /> +₹450.00 Cashback Available
                  </div>
                  <div className="flex items-center gap-2 bg-blue-500/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-blue-400 border border-blue-500/20">
                     <CreditCard className="h-3.5 w-3.5" /> 2 Cards Linked
                  </div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
               <Button className="bg-primary hover:bg-blue-700 text-white font-extrabold rounded-2xl h-16 px-10 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="h-5 w-5 mr-2" /> ADD MONEY
               </Button>
               <Button variant="outline" className="border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white font-extrabold rounded-2xl h-16 px-10 border-2 transition-all">
                  <ArrowUpRight className="h-5 w-5 mr-2" /> WITHDRAW
               </Button>
            </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group">
            <div className="flex items-center justify-between mb-6">
               <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                  <RefreshCcw className="h-6 w-6" />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">On Hold</span>
            </div>
            <p className="text-sm font-bold text-slate-500">Refunds & Pending</p>
            <p className="text-3xl font-black text-slate-900 mt-2">₹{Number(wallet?.pendingBalance || 0).toLocaleString()}</p>
         </div>

         <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group">
            <div className="flex items-center justify-between mb-6">
               <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <CreditCard className="h-6 w-6" />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expenses</span>
            </div>
            <p className="text-sm font-bold text-slate-500">Lifetime Spending</p>
            <p className="text-3xl font-black text-slate-900 mt-2">₹{Number(wallet?.lifetimeSpending || 0).toLocaleString()}</p>
         </div>

         <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 shadow-sm group relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="h-24 w-24 text-primary" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                   <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                      <Plus className="h-6 w-6" />
                   </div>
                   <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-widest">Savings</span>
                </div>
                <p className="text-sm font-bold text-slate-500">Total Cashback Earned</p>
                <p className="text-3xl font-black text-slate-900 mt-2">₹2,450.00</p>
            </div>
         </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-extrabold text-slate-900">Recent Transactions</h3>
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
               <input
                  placeholder="Filter transactions..."
                  className="pl-11 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none w-full sm:w-72 transition-all shadow-sm"
               />
            </div>
         </div>

         <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
            {wallet?.transaction?.length > 0 ? (
               <div className="divide-y divide-slate-100">
                  {wallet.transaction.map((tx: any) => (
                     <div key={tx.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all cursor-pointer group">
                        <div className="flex items-center gap-6">
                           <div className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                              tx.type === 'CREDIT'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-slate-50 text-slate-600 border-slate-100'
                           )}>
                              {tx.type === 'CREDIT' ? <ArrowDownLeft className="h-7 w-7" /> : <ArrowUpRight className="h-7 w-7" />}
                           </div>
                           <div>
                              <p className="text-base font-extrabold text-slate-900 group-hover:text-primary transition-colors">{tx.description || (tx.type === 'CREDIT' ? 'Money Added to Wallet' : 'Service Payment')}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(tx.createdAt), 'MMM dd, yyyy • hh:mm a')}</p>
                                 <div className="h-1 w-1 rounded-full bg-slate-300" />
                                 <span className={cn(
                                    "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                                    tx.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                 )}>
                                    {tx.status}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className={cn(
                              "text-xl font-black",
                              tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                           )}>
                              {tx.type === 'CREDIT' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                           </p>
                           <button className="text-[10px] font-black text-primary uppercase opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 mt-1 ml-auto">
                              VIEW RECEIPT <ChevronRight className="h-3 w-3" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="py-24 text-center">
                  <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <History className="h-10 w-10 text-slate-300" />
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900">No transactions yet</h4>
                  <p className="text-slate-500 mt-2 font-medium max-w-xs mx-auto">Your digital wallet activities and event payments will appear here.</p>
                  <Button variant="outline" className="mt-8 rounded-xl font-bold border-slate-200">
                     Learn about Mana Wallet
                  </Button>
               </div>
            )}
         </div>
      </div>
    </div>

  );
}
