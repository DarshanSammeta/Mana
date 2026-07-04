"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Download,
  TrendingUp,
  ArrowRight,
  Wallet,
  Clock,
  ChevronRight,
  FileText,
  Table as TableIcon,
  Loader2
} from "lucide-react";
import { TableSkeleton } from "@/components/vendor/TableSkeleton";
import { Card, CardContent, CardHeader, CardTitle, GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generateEarningsPDF, generateEarningsExcel } from "@/lib/reports";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";

import { useSocketStore } from "@/store/socketStore";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { vendorService } from "@/services/vendor.service";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

export default function EarningsPage() {
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const { socket } = useSocketStore();

  const { data: earningsData, isLoading: loading } = useQuery({
    queryKey: ['vendor-earnings'],
    queryFn: () => vendorService.getEarnings(),
  });

  const {
    data: transactionData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: transactionsLoading,
  } = useInfiniteQuery({
    queryKey: ['vendor-transactions-earnings'],
    queryFn: ({ pageParam }) => vendorService.getTransactions(10, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  useEffect(() => {
    if (!socket) return;
    socket.on("wallet:updated", (data: { amount: number }) => {
      toast.success(`Wallet Updated: ₹${data.amount}`, { icon: '💰' });
      queryClient.invalidateQueries({ queryKey: ['vendor-earnings'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-transactions-earnings'] });
    });
    return () => { socket.off("wallet:updated"); };
  }, [socket, queryClient]);

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => vendorService.requestPayout(amount),
    onSuccess: () => {
        toast.success("Withdrawal request submitted successfully!");
        setWithdrawAmount("");
        setIsWithdrawDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['vendor-earnings'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
        toast.error(error.response?.data?.message || "An error occurred.");
    }
  });

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > (earningsData?.summary?.withdrawableRevenue || 0)) {
      toast.error("Insufficient balance");
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const stats = earningsData?.summary;
  const transactions = transactionData?.pages.flatMap(page => page.items) || [];

  const statCards = [
    { title: "Total Revenue", value: stats?.totalRevenue || 0, icon: DollarSign, color: "text-success", bg: "bg-success/10", trend: "+12.5%" },
    { title: "Pending Payout", value: stats?.pendingRevenue || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", trend: "Processing" },
    { title: "Available Balance", value: stats?.withdrawableRevenue || 0, icon: Wallet, color: "text-primary", bg: "bg-primary/10", trend: "Ready to withdraw" },
    { title: "Monthly Revenue", value: stats?.monthlyRevenue || 0, icon: TrendingUp, color: "text-secondary", bg: "bg-secondary/10", trend: "This Month" },
  ];

  const handleDownloadPDF = async () => {
    const blob = await generateEarningsPDF("Vendor Name", transactions);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "earnings-report.pdf";
    a.click();
  };

  const handleDownloadExcel = async () => {
    const blob = await generateEarningsExcel("Vendor Name", transactions);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "earnings-report.xlsx";
    a.click();
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <motion.h2 variants={itemAnim} className="text-4xl font-black tracking-tight">Earnings</motion.h2>
          <motion.p variants={itemAnim} className="text-muted-foreground text-lg mt-1">Track your revenue, payouts, and financial growth.</motion.p>
        </div>
        <motion.div variants={itemAnim} className="flex gap-3">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="lg" variant="outline" className="rounded-2xl gap-2 font-bold">
                        <Download className="h-5 w-5" />
                        Report
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border border-border shadow-2xl p-2 bg-card/80 backdrop-blur-xl">
                    <DropdownMenuItem onClick={handleDownloadPDF} className="rounded-xl gap-2 font-bold cursor-pointer">
                        <FileText className="h-4 w-4 text-cta" />
                        Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadExcel} className="rounded-xl gap-2 font-bold cursor-pointer">
                        <TableIcon className="h-4 w-4 text-success" />
                        Download Excel
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="premium" className="rounded-2xl gap-2">
                    <ArrowRight className="h-5 w-5 rotate-[-45deg]" />
                    Withdraw Funds
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Withdraw Funds</DialogTitle>
                  <DialogDescription className="font-medium">
                    Enter the amount you wish to withdraw to your primary bank account.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="amount" className="font-bold">Amount (₹)</Label>
                      <span className="text-xs font-bold text-muted-foreground">Available: ₹{Number(stats?.withdrawableRevenue || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="rounded-xl border-border bg-secondary/20 h-12 font-bold text-lg"
                    />
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="text-[10px] font-black text-primary uppercase mb-2">Payout Target</p>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <div className="h-4 w-4 bg-primary rounded-full" />
                      </div>
                      <p className="text-sm font-bold">HDFC Bank .... 8901</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawMutation.isPending || !withdrawAmount}
                    className="w-full rounded-2xl h-12 font-black text-lg shadow-xl shadow-primary/20"
                  >
                    {withdrawMutation.isPending ? "Processing..." : "Confirm Withdrawal"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-none shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <div className="flex items-baseline gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-4 w-10" />
              </div>
            </Card>
          ))
        ) : statCards.map((stat) => (
          <motion.div key={stat.title} variants={itemAnim}>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
                    <div className={`${stat.bg} p-2.5 rounded-xl transition-transform group-hover:rotate-12`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-black">₹ {Number(stat.value).toLocaleString('en-IN')}</div>
                        <div className={`text-[10px] font-bold ${stat.color} flex items-center gap-0.5`}>
                            {stat.trend}
                        </div>
                    </div>
                </CardContent>
                <div className={`h-1 w-full absolute bottom-0 left-0 ${stat.bg.replace('/10', '')}`} />
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Transaction Table */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemAnim}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                    Recent Transactions
                </h3>
            </div>

            <div className="space-y-4">
                  {transactionsLoading ? (
                    <TableSkeleton rows={5} columns={1} />
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground bg-card rounded-2xl border border-dashed border-border">No transactions found</div>
                  ) : (
                    <>
                      {transactions.map((tx: {
                        id: string;
                        type: string;
                        description: string;
                        amount: number;
                        createdAt: string;
                        status: string;
                        booking?: {
                          bookingNumber: string;
                          payment?: { payment_split: any }[];
                        };
                      }) => {
                        const split = tx.booking?.payment?.find((p: any) => p.payment_split)?.payment_split;

                        return (
                              <Card key={tx.id} className="border border-border shadow-sm hover:shadow-xl bg-card overflow-hidden transition-all mb-4">
                                <div className="p-4">
                                  <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center",
                                        tx.type === "CREDIT" || tx.type === "COMMISSION" ? "bg-success/10" : "bg-destructive/10"
                                    )}>
                                        {tx.type === "CREDIT" || tx.type === "COMMISSION" ?
                                            <ArrowDownLeft className={cn("h-6 w-6", "text-success")} /> :
                                            <ArrowUpRight className="h-6 w-6 text-destructive" />
                                        }
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-foreground truncate">
                                              {tx.description}
                                              {tx.booking?.bookingNumber && <span className="ml-2 text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-full">#{tx.booking.bookingNumber}</span>}
                                            </h4>
                                            <span className={cn(
                                                "text-lg font-black",
                                                tx.type === "CREDIT" || tx.type === "COMMISSION" ? "text-success" : "text-destructive"
                                            )}>
                                                {tx.type === "CREDIT" || tx.type === "COMMISSION" ? "+" : "-"}₹{Number(tx.amount).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{tx.type}</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-muted-foreground/60">{new Date(tx.createdAt).toLocaleDateString()}</span>
                                                <Badge className={cn(
                                                    "text-[10px] uppercase tracking-tighter px-2 py-0 border-none",
                                                    tx.status === "COMPLETED" ? "bg-success/10 text-success" : (tx.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-destructive/10 text-destructive")
                                                )}>
                                                    {tx.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                  </div>

                                  {split && (
                                    <div className="mt-4 pt-4 border-t border-dashed border-border flex flex-wrap justify-between items-center gap-4">
                                      <div className="flex gap-4">
                                        <div className="space-y-0.5">
                                          <p className="text-[8px] font-black text-muted-foreground uppercase">Base Amount</p>
                                          <p className="text-xs font-bold">₹{Number(split.totalAmount).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                          <p className="text-[8px] font-black text-muted-foreground uppercase">Platform Fee ({Number(split.commissionRate)}%)</p>
                                          <p className="text-xs font-bold text-destructive">-₹{Number(split.adminShare).toLocaleString('en-IN')}</p>
                                        </div>
                                      </div>
                                      <div className="bg-success/5 px-3 py-1.5 rounded-xl border border-success/10">
                                        <p className="text-[8px] font-black text-success uppercase">Your Net Share</p>
                                        <p className="text-sm font-black text-success">₹{Number(split.vendorShare).toLocaleString('en-IN')}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </Card>
                        );
                      })}
                      <div ref={ref} className="py-4 flex justify-center">
                        {isFetchingNextPage ? (
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : hasNextPage ? (
                          <span className="text-xs font-black uppercase text-muted-foreground/40">Load more</span>
                        ) : null}
                      </div>
                    </>
                  )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-8">
            <motion.div variants={itemAnim}>
                <GlassCard className="border-none shadow-xl bg-primary text-primary-foreground overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="h-24 w-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-primary-foreground text-lg">Monthly Goal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-primary-foreground/90">Revenue Target</span>
                                <span className="font-bold">75% reached</span>
                            </div>
                            <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "75%" }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-primary-foreground"
                                />
                            </div>
                        </div>
                        <p className="text-primary-foreground/90 text-sm leading-relaxed">
                            You&apos;re ₹ 12,000 away from your best month ever. Keep it up!
                        </p>
                    </CardContent>
                </GlassCard>
            </motion.div>

            <motion.div variants={itemAnim}>
                <h3 className="text-xl font-bold mb-6">Payout Methods</h3>
                <div className="space-y-4">
                    <div className="p-4 rounded-3xl border border-primary/20 bg-primary/5 flex items-center justify-between group cursor-pointer hover:bg-primary/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-card flex items-center justify-center shadow-sm">
                                <div className="h-6 w-6 bg-primary rounded-full" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-foreground">HDFC Bank .... 8901</p>
                                <p className="text-[10px] font-bold text-primary uppercase">Primary Method</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>

                    <div className="p-4 rounded-3xl border border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-all cursor-pointer h-20">
                        <CreditCard className="h-5 w-5" />
                        <span className="text-sm font-bold">Add New Method</span>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={itemAnim}>
                <Card className="border border-border shadow-sm bg-secondary/5 p-6 rounded-[2rem]">
                    <h3 className="font-bold text-foreground mb-4">Payout Schedule</h3>
                    <div className="space-y-4">
                        {[
                            { label: "Processing", date: "Every Monday" },
                            { label: "Settlement", date: "T+2 Business Days" }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">{item.label}</span>
                                <span className="font-bold text-foreground">{item.date}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
