"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CreditCard,
  ShieldCheck,
  History,
  Download,
  AlertCircle,
  ChevronRight,
  Info,
  Banknote,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { generateEarningsCSV } from "@/lib/reports";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useSocketStore } from "@/store/socketStore";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/vendor/TableSkeleton";

export default function VendorWallet() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { socket } = useSocketStore();

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const [walletRes, transRes, payoutRes] = await Promise.all([
        fetch("/api/wallet", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/wallet/transactions", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/payouts", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (walletRes.ok) setWallet(await walletRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
      if (payoutRes.ok) setWithdrawalHistory(await payoutRes.json());
    } catch (error) {
      console.error("Failed to fetch wallet data");
      toast.error("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("wallet:updated", () => fetchWalletData());
    return () => { socket.off("wallet:updated"); };
  }, [socket]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amount = Number(withdrawAmount);
    if (amount > (Number(wallet?.withdrawable) || 0)) {
      toast.error("Insufficient withdrawable balance");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      if (res.ok) {
        toast.success("Withdrawal request submitted");
        setIsWithdrawModalOpen(false);
        setWithdrawAmount("");
        fetchWalletData();
      } else {
        const data = await res.json();
        toast.error(data.message || "Withdrawal failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }
    try {
      const blob = await generateEarningsCSV(transactions);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const balances = [
    {
      label: "Withdrawable",
      value: Number(wallet?.withdrawable || 0),
      icon: Banknote,
      desc: "Available for immediate withdrawal",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      label: "Pending Settlement",
      value: Number(wallet?.pendingBalance || 0),
      icon: Clock,
      desc: "Current month's upcoming payouts",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      label: "Lifetime Revenue",
      value: Number(wallet?.lifetimeEarnings || 0),
      icon: ShieldCheck,
      desc: "Your total successful earnings",
      color: "text-success",
      bg: "bg-success/10"
    }
  ];

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Financial Wallet</h1>
          <p className="text-muted-foreground text-lg mt-1">Manage your funds, payouts, and view history.</p>
        </div>
        <button
          onClick={() => setIsWithdrawModalOpen(true)}
          className="px-8 py-4 bg-primary text-white rounded-[20px] font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
            Request Payout <ArrowUpRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? (
            [1, 2, 3].map(i => (
                <div key={i} className="bg-card p-8 rounded-[32px] border border-border/50 shadow-sm">
                    <Skeleton className="h-4 w-24 mb-6" />
                    <Skeleton className="h-10 w-40 mb-4" />
                    <Skeleton className="h-3 w-32" />
                </div>
            ))
        ) : balances.map((item, i) => (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="bg-card p-8 rounded-[32px] border border-border/50 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all"
            >
                <div className="flex justify-between items-start mb-6">
                    <div className={cn("p-3 rounded-2xl", item.bg)}>
                        <item.icon className={cn("h-6 w-6", item.color)} />
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{item.label}</p>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black opacity-50">₹</span>
                    <h3 className="text-4xl font-black text-foreground tracking-tighter">
                        <CountUp end={item.value} duration={1} separator="," decimals={0} />
                    </h3>
                </div>
                <p className="text-xs font-bold text-muted-foreground mt-2">{item.desc}</p>
            </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black flex items-center gap-3">
                    <History className="h-6 w-6 text-primary" /> Transaction Feed
                </h2>
                <button
                  onClick={handleExportCSV}
                  className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Export CSV
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <TableSkeleton rows={5} columns={3} />
                ) : transactions.length === 0 ? (
                    <div className="text-center py-20 bg-secondary/10 rounded-[32px] border border-dashed border-border">
                        <p className="text-muted-foreground font-bold italic">No transactions recorded yet.</p>
                    </div>
                ) : transactions.map((tx) => (
                    <div key={tx.id} className="p-6 bg-card rounded-3xl border border-border/50 flex items-center justify-between group hover:border-primary/10 transition-all">
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                tx.type === 'CREDIT' ? "bg-success/10" : "bg-destructive/10"
                            )}>
                                {tx.type === 'CREDIT' ? <ArrowDownLeft className="h-6 w-6 text-success" /> : <ArrowUpRight className="h-6 w-6 text-destructive" />}
                            </div>
                            <div>
                                <h4 className="font-black text-foreground">{tx.description}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{format(new Date(tx.createdAt), "dd MMM, yyyy • HH:mm")}</span>
                                    <span className={cn(
                                        "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                        tx.status === 'COMPLETED' ? "bg-success/10 text-success" : "bg-amber-100 text-amber-700"
                                    )}>{tx.status}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={cn(
                                "text-xl font-black",
                                tx.type === 'CREDIT' ? "text-success" : "text-destructive"
                            )}>
                                {tx.type === 'CREDIT' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{tx.type}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="space-y-10">
            <div>
                <h3 className="text-xl font-black mb-6">Payout History</h3>
                <div className="space-y-4">
                    {withdrawalHistory.slice(0, 5).map((wd, i) => (
                        <div key={i} className="p-5 bg-card rounded-3xl border border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                                    {wd.status === 'RELEASED' ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Clock className="h-5 w-5 text-amber-500" />}
                                </div>
                                <div>
                                    <p className="text-sm font-black tracking-tight">₹{Number(wd.amount).toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(wd.createdAt), "dd MMM")}</p>
                                </div>
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                wd.status === 'RELEASED' ? "text-success" : (wd.status === 'FAILED' ? "text-destructive" : "text-amber-500")
                            )}>{wd.status}</span>
                        </div>
                    ))}
                    {withdrawalHistory.length === 0 && <p className="text-center text-xs text-muted-foreground py-4 font-bold italic">No payouts requested.</p>}
                </div>
            </div>

            <div className="p-8 bg-primary rounded-[32px] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <ShieldCheck className="h-32 w-32" />
                </div>
                <h3 className="text-lg font-black mb-2">Banking Details</h3>
                <p className="text-sm opacity-80 mb-6 font-medium">Your primary settlement account for all disbursements.</p>
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-tighter">{wallet?.bankDetails?.bankName || "HDFC Bank"}</p>
                            <p className="text-sm font-black">**** {wallet?.bankDetails?.accountNumber?.slice(-4) || "9012"}</p>
                        </div>
                    </div>
                </div>
                <button className="w-full mt-6 py-3 bg-white text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all">
                    Update Details
                </button>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card rounded-[40px] shadow-2xl max-w-md w-full p-10 border border-border/50 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-foreground">Withdraw Funds</h2>
                <button onClick={() => setIsWithdrawModalOpen(false)} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive hover:text-white transition-all">
                    <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-secondary/20 rounded-3xl border border-border/50">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                        Maximum Withdrawable
                    </label>
                    <p className="text-4xl font-black text-primary tracking-tight">₹{Number(wallet?.withdrawable || 0).toLocaleString('en-IN')}</p>
                </div>

                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                        Enter Amount (₹)
                    </label>
                    <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-6 bg-secondary/30 border-none rounded-3xl focus:ring-4 focus:ring-primary/10 outline-none text-2xl font-black text-foreground"
                    />
                </div>

                <div className="flex gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <Info className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                        Funds will be credited to <strong>{wallet?.bankDetails?.bankName || "HDFC Bank"}</strong> account ending in <strong>{wallet?.bankDetails?.accountNumber?.slice(-4) || "9012"}</strong> within 2-3 business days.
                    </p>
                </div>

                <button
                    onClick={handleWithdraw}
                    disabled={isSubmitting || !withdrawAmount}
                    className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-lg shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isSubmitting ? "Processing Request..." : "Confirm Withdrawal"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
