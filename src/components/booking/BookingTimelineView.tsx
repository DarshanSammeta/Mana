"use client";

import { useQuery } from "@tanstack/react-query";
import { formatSafe } from "@/lib/utils/date";
import {
  CheckCircle2, Clock, CreditCard, Users,
  Truck, Play, Flag, Lock, XCircle, Package, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/apiClient";

const ICON_MAP: Record<string, any> = {
  CheckCircle2, Clock, CreditCard, Users,
  Truck, Play, Flag, Lock, XCircle, Package, Sparkles
};

const COLOR_MAP: Record<string, string> = {
  emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
  blue: "text-blue-600 bg-blue-50 border-blue-100",
  amber: "text-amber-600 bg-amber-50 border-amber-100",
  rose: "text-rose-600 bg-rose-50 border-rose-100",
  indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
  purple: "text-purple-600 bg-purple-50 border-purple-100",
  orange: "text-orange-600 bg-orange-50 border-orange-100",
  slate: "text-slate-600 bg-slate-50 border-slate-100",
};

export function BookingTimelineView({ bookingId }: { bookingId: string }) {
    const { data: timeline, isLoading } = useQuery({
        queryKey: ["booking-timeline", bookingId],
        queryFn: async () => {
            const res = await apiClient.get(`/bookings/${bookingId}/timeline`);
            return res.data;
        },
        refetchInterval: 5000 // Real-time poll fallback
    });

    if (isLoading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-xl" />)}</div>;

    return (
        <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            {timeline?.map((item: any) => {
                const Icon = ICON_MAP[item.icon] || CheckCircle2;
                const colors = COLOR_MAP[item.color] || COLOR_MAP.slate;

                return (
                    <div key={item.id} className="relative group">
                        <div className={cn(
                            "absolute -left-8 top-0 h-6 w-6 rounded-full border-4 border-white flex items-center justify-center z-10 transition-transform group-hover:scale-110 shadow-sm",
                            colors
                        )}>
                            <Icon className="h-3 w-3" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{item.title}</h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{formatSafe(item.createdAt, "MMM d, h:mm a")}</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.role}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{item.performedBy}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
