"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar, Eye, Package, Users,
  Wallet, Clock
} from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import apiClient from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useSocketStore } from "@/store/socketStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function OperationalStats() {
    const queryClient = useQueryClient();
    const socket = useSocketStore(state => state.socket);

    const { data: stats, isLoading } = useQuery({
        queryKey: ["vendor-operational-stats"],
        queryFn: async () => {
            const res = await apiClient.get("/vendor/dashboard/operational-stats");
            return res.data;
        },
        refetchInterval: 30000
    });

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-operational-stats"] });
        };
        socket.on("booking:update", handleUpdate);
        return () => { socket.off("booking:update", handleUpdate); };
    }, [socket, queryClient]);

    const cards = [
        {
            label: "Today's Events",
            value: stats?.todayEvents || 0,
            icon: Calendar,
            color: "text-emerald-600 bg-emerald-50",
            link: "/vendor/bookings?filter=today"
        },
        {
            label: "Pending Review",
            value: stats?.pendingReview || 0,
            icon: Eye,
            color: "text-amber-600 bg-amber-50",
            link: "/vendor/bookings?status=VENDOR_REVIEW"
        },
        {
            label: "Preparation Pending",
            value: stats?.prepPending || 0,
            icon: Package,
            color: "text-indigo-600 bg-indigo-50",
            link: "/vendor/bookings?status=CONFIRMED"
        },
        {
            label: "Assign Team",
            value: stats?.teamPending || 0,
            icon: Users,
            color: "text-blue-600 bg-blue-50",
            link: "/vendor/bookings?filter=assign_team"
        },
        {
            label: "Balance Due",
            value: stats?.balancePending || 0,
            icon: Wallet,
            color: "text-rose-600 bg-rose-50",
            link: "/vendor/bookings?status=BALANCE_PENDING"
        },
        {
            label: "Upcoming (7d)",
            value: stats?.upcoming || 0,
            icon: Clock,
            color: "text-slate-600 bg-slate-50",
            link: "/vendor/bookings?filter=upcoming"
        }
    ];

    if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />)}</div>;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cards.map((card, i) => (
                <GlassCard
                    key={i}
                    className="p-4 hover:shadow-lg transition-all cursor-pointer border-slate-100 group"
                    onClick={() => card.link && (window.location.href = card.link)}
                >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform", card.color)}>
                        <card.icon className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">{card.label}</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">{card.value}</h3>
                </GlassCard>
            ))}
        </div>
    );
}
