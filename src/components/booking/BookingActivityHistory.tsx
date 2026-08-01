"use client";

import { useQuery } from "@tanstack/react-query";
import { formatSafe } from "@/lib/utils/date";
import {
  History, Laptop,
  Terminal, Globe, ChevronDown, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/apiClient";
import { Badge } from "@/components/ui/badge";

export function BookingActivityHistory({ bookingId }: { bookingId: string }) {
    const [expandedLog, setExpandedRow] = useState<string | null>(null);

    const { data: logs, isLoading } = useQuery({
        queryKey: ["booking-audit-logs", bookingId],
        queryFn: async () => {
            const res = await apiClient.get("/admin/audit-logs", {
                params: { bookingId, limit: 100 }
            });
            return res.data.logs;
        }
    });

    if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}</div>;

    if (!logs || logs.length === 0) return (
        <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed">
            <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase italic">No activity history found</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {logs.map((log: any) => (
                <div key={log.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                    <div
                        className="p-4 flex items-center justify-between cursor-pointer group"
                        onClick={() => setExpandedRow(expandedLog === log.id ? null : log.id)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                expandedLog === log.id ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                            )}>
                                {expandedLog === log.id ? <Terminal className="h-5 w-5" /> : <History className="h-5 w-5" />}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">
                                    {log.action.replace(/_/g, ' ')}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{formatSafe(log.createdAt, "MMM d, h:mm a")}</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                                    <span className="text-[10px] font-black text-primary uppercase">{log.performedByName}</span>
                                </div>
                            </div>
                        </div>
                        {expandedLog === log.id ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>

                    {expandedLog === log.id && (
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <Globe className="h-3 w-3" /> Execution Context
                                    </h5>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-400 font-bold uppercase">Role</span>
                                            <Badge variant="outline" className="text-[9px] font-black uppercase">{log.performedByRole}</Badge>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-400 font-bold uppercase">Platform</span>
                                            <span className="text-slate-900 font-black">{log.device} ({log.browser})</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-400 font-bold uppercase">IP Address</span>
                                            <span className="text-slate-900 font-mono font-bold">{log.ipAddress}</span>
                                        </div>
                                    </div>
                                </div>
                                {(log.oldValue || log.newValue) && (
                                    <div className="space-y-4">
                                        <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                            <Laptop className="h-3 w-3" /> Data Changes
                                        </h5>
                                        <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                                            <pre className="text-[9px] text-emerald-400 font-mono leading-relaxed">
                                                {JSON.stringify({
                                                    before: log.oldValue,
                                                    after: log.newValue
                                                }, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
