"use client";

import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Clock, Users, MapPin,
  ShieldCheck, ArrowLeft, Download,
  CreditCard, Package, Play, Star,
  Smartphone, MessageSquare, Info
} from "lucide-react";
import { formatSafe } from "@/lib/utils/date";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { BookingTimelineView } from "@/components/booking/BookingTimelineView";
import { useSocketStore } from "@/store/socketStore";
import { BookingActivityHistory } from "@/components/booking/BookingActivityHistory";

const STEPS = [
  { id: "DRAFT", label: "Draft" },
  { id: "PENDING_ADVANCE", label: "Deposit" },
  { id: "ADVANCE_PAID", label: "Paid" },
  { id: "VENDOR_REVIEW", label: "Review" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "PREPARATION_STARTED", label: "Prep" },
  { id: "VENDOR_ASSIGNED", label: "Team" },
  { id: "VENDOR_EN_ROUTE", label: "En Route" },
  { id: "EVENT_STARTED", label: "Live" },
  { id: "EVENT_COMPLETED", label: "Completed" },
  { id: "BALANCE_PENDING", label: "Balance" },
  { id: "FULLY_PAID", label: "Settled" },
  { id: "CLOSED", label: "Closed" }
];

export default function TrackingClient({ bookingId }: { bookingId: string }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const socket = useSocketStore(state => state.socket);

    const { data: booking, isLoading } = useQuery({
        queryKey: ["booking-tracking", bookingId],
        queryFn: async () => {
            const res = await apiClient.get(`/customer/bookings/${bookingId}/tracking`);
            return res.data;
        },
        refetchInterval: 10000
    });

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (data: any) => {
            if (data.bookingId === bookingId) {
                queryClient.invalidateQueries({ queryKey: ["booking-tracking", bookingId] });
                queryClient.invalidateQueries({ queryKey: ["booking-timeline", bookingId] });
            }
        };

        socket.on("booking:update", handleUpdate);
        return () => { socket.off("booking:update", handleUpdate); };
    }, [socket, bookingId, queryClient]);

    if (isLoading) return <div className="p-20 text-center animate-pulse font-black uppercase italic">Syncing with Mission Control...</div>;

    const currentStepIndex = STEPS.findIndex(s => s.id === booking.status);
    const prepProgress = booking.booking_checklist?.length
        ? Math.round((booking.booking_checklist.filter((i:any) => i.isCompleted).length / booking.booking_checklist.length) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 pt-28">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 space-y-10">

                {/* Header & Back */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight italic uppercase mt-4">ME-{booking.bookingNumber}</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">{booking.eventName} • {formatSafe(booking.eventDate, "MMMM d, yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-xl font-black uppercase tracking-widest gap-2">
                             <MessageSquare className="h-4 w-4" /> Chat with Vendor
                        </Button>
                        <Button className="rounded-xl font-black uppercase tracking-widest gap-2">
                             <Info className="h-4 w-4" /> Need Help?
                        </Button>
                    </div>
                </div>

                {/* Stepper Progress */}
                <GlassCard className="p-8 border-slate-100 overflow-x-auto scrollbar-hide">
                    <div className="min-w-[800px] lg:min-w-full relative py-4">
                        <div className="absolute top-8 left-0 right-0 h-1 bg-slate-100 rounded-full" />
                        <div
                            className="absolute top-8 left-0 h-1 bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                        />
                        <div className="flex justify-between relative z-10">
                            {STEPS.map((step, idx) => {
                                const isCompleted = idx < currentStepIndex;
                                const isActive = idx === currentStepIndex;

                                return (
                                    <div key={step.id} className="flex flex-col items-center gap-3">
                                        <div className={cn(
                                            "h-9 w-9 rounded-full border-4 border-white flex items-center justify-center transition-all shadow-sm",
                                            isCompleted ? "bg-emerald-500 text-white" :
                                            isActive ? "bg-primary text-white scale-110 shadow-xl shadow-primary/20" :
                                            "bg-slate-200 text-slate-400"
                                        )}>
                                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest text-center whitespace-nowrap",
                                            isActive ? "text-primary" : "text-slate-400"
                                        )}>{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </GlassCard>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left: Operational Tracking with Tabs */}
                    <div className="lg:col-span-8 space-y-8">
                        <Tabs defaultValue="tracking" className="space-y-8">
                            <TabsList className="bg-white p-1 rounded-2xl h-14 w-full md:w-fit border border-slate-100 shadow-sm overflow-x-auto overflow-y-hidden">
                                <TabsTrigger value="tracking" className="rounded-xl px-8 font-black uppercase tracking-widest h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white">Live Tracking</TabsTrigger>
                                <TabsTrigger value="team" className="rounded-xl px-8 font-black uppercase tracking-widest h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white">Team</TabsTrigger>
                                <TabsTrigger value="history" className="rounded-xl px-8 font-black uppercase tracking-widest h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white">Activity History</TabsTrigger>
                            </TabsList>

                            <TabsContent value="tracking" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Preparation Progress */}
                                {booking.status === "PREPARATION_STARTED" || booking.status === "VENDOR_ASSIGNED" ? (
                                    <GlassCard className="p-8 border-indigo-100 bg-indigo-50/30">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <Package className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Event Preparation</h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Live checklist tracking</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-indigo-600">{prepProgress}%</p>
                                            </div>
                                        </div>
                                        <Progress value={prepProgress} className="h-2 bg-indigo-100" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                            {booking.booking_checklist?.map((item: any) => (
                                                <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                                                    <div className={cn(
                                                        "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                                        item.isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200"
                                                    )}>
                                                        {item.isCompleted && <CheckCircle2 className="h-3 w-3" />}
                                                    </div>
                                                    <span className={cn("text-xs font-bold", item.isCompleted ? "text-slate-900" : "text-slate-400")}>{item.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </GlassCard>
                                ) : null}

                                {/* Event Execution Section */}
                                {["VENDOR_EN_ROUTE", "EVENT_STARTED", "EVENT_ONGOING"].includes(booking.status) ? (
                                    <GlassCard className="p-8 border-rose-100 bg-rose-50/30">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 animate-pulse">
                                                <Play className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tight italic text-rose-600">Event is Live!</h3>
                                                <p className="text-xs text-rose-400 font-bold uppercase tracking-widest">Tracking execution milestones</p>
                                            </div>
                                        </div>
                                        <div className="p-10 text-center bg-white rounded-[2rem] border border-rose-50 shadow-sm">
                                            <MapPin className="h-12 w-12 text-rose-200 mx-auto mb-4" />
                                            <h4 className="text-lg font-black text-slate-900 uppercase">Vendor has reached the venue</h4>
                                            <p className="text-slate-500 text-sm font-medium mt-2">Setup is complete and service delivery has commenced.</p>
                                        </div>
                                    </GlassCard>
                                ) : null}

                                {/* Detailed Timeline */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Operational Activity Log</h3>
                                    </div>
                                    <GlassCard className="p-8 border-slate-100">
                                        <BookingTimelineView bookingId={bookingId} />
                                    </GlassCard>
                                </div>
                            </TabsContent>

                            <TabsContent value="team" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Team Section */}
                                {booking.booking_team_assignment?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {booking.booking_team_assignment.map((assignment: any) => (
                                            <GlassCard key={assignment.id} className="p-5 border-slate-100 hover:shadow-lg transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-primary font-black text-lg">
                                                        {assignment.member.avatar || assignment.member.name[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-slate-900 truncate">{assignment.member.name}</h4>
                                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{assignment.roleAtEvent || assignment.member.role}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status: Active</span>
                                                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest gap-1.5">
                                                        <Smartphone className="h-3 w-3" /> Contact
                                                    </Button>
                                                </div>
                                            </GlassCard>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed">
                                        <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-black text-slate-400 uppercase italic">No team members assigned yet</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <BookingActivityHistory bookingId={bookingId} />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right: Summary & Finance */}
                    <div className="lg:col-span-4 space-y-8 sticky top-32">
                        {/* Vendor Card */}
                        <GlassCard className="p-6 border-slate-100 bg-white">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                                <div className="h-14 w-14 rounded-2xl overflow-hidden bg-slate-50 relative border">
                                    {booking.vendorprofile.logo ? (
                                        <Image src={booking.vendorprofile.logo} alt="logo" fill className="object-cover" />
                                    ) : <Users className="h-6 w-6 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 leading-tight">{booking.vendorprofile.businessName}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-1 text-[10px] font-black text-amber-500">
                                            <Star className="h-3 w-3 fill-current" /> {booking.vendorprofile.rating.toFixed(1)}
                                        </div>
                                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{booking.vendorprofile.city}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Assigned To</span>
                                    <span className="text-slate-900">Premium Partner</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Verification</span>
                                    <span className="text-emerald-500 flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3" /> Fully Verified
                                    </span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Payment & Documents */}
                        <GlassCard className="p-8 border-slate-900 bg-slate-900 text-white">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-white/10 rounded-xl"><CreditCard className="h-5 w-5 text-primary" /></div>
                                <h3 className="font-black text-lg uppercase tracking-tight italic">Finance Hub</h3>
                            </div>

                            <div className="space-y-6 mb-10">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advance Paid</span>
                                    <span className="text-xl font-black italic text-emerald-400">₹{Number(booking.advanceAmount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Pending</span>
                                    <span className={cn(
                                        "text-xl font-black italic",
                                        booking.status === "FULLY_PAID" || booking.status === "CLOSED" ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        ₹{Number(booking.balanceAmount).toLocaleString()}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-widest">Total Amount</span>
                                    <span className="text-2xl font-black text-primary">₹{Number(booking.totalAmount).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Documents</p>
                                {booking.booking_document?.map((doc: any) => (
                                    <button
                                        key={doc.id}
                                        className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-between transition-all group"
                                        onClick={() => window.open(doc.url, "_blank")}
                                    >
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-widest">{doc.name}</p>
                                            <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">{formatSafe(doc.createdAt, "MMM d")}</p>
                                        </div>
                                        <Download className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                    </button>
                                ))}
                                {booking.booking_document?.length === 0 && <p className="text-[10px] text-slate-500 font-bold uppercase">No documents available yet</p>}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
