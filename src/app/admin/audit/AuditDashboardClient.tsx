"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatSafe } from "@/lib/utils/date";
import {
  ChevronDown, ChevronRight,
  Download, History,
  Terminal
} from "lucide-react";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/apiClient";
import { cn } from "@/lib/utils";

export default function AuditDashboardClient() {
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState({
        bookingId: "",
        action: "",
        module: "",
        role: ""
    });
    const limit = 50;

    const { data } = useQuery({
        queryKey: ["admin-audit-logs", page, filters],
        queryFn: async () => {
            const res = await apiClient.get("/admin/audit-logs", {
                params: {
                    limit,
                    offset: page * limit,
                    ...filters
                }
            });
            return res.data;
        }
    });

    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const handleExportCSV = () => {
        if (!data?.logs) return;

        const headers = ["ID", "Timestamp", "Module", "Action", "Performed By", "Role", "Entity ID", "IP Address"];
        const rows = data.logs.map((log: any) => [
            log.id,
            formatSafe(log.createdAt, "yyyy-MM-dd HH:mm:ss"),
            log.module,
            log.action,
            log.performedByName,
            log.performedByRole,
            log.bookingId || log.entityId,
            log.ipAddress
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `audit_logs_${formatSafe(new Date(), "yyyyMMdd_HHmmss")}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                    placeholder="Search Booking ID..."
                    className="rounded-xl"
                    value={filters.bookingId}
                    onChange={(e) => setFilters({...filters, bookingId: e.target.value})}
                />
                <select
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-bold"
                    value={filters.module}
                    onChange={(e) => setFilters({...filters, module: e.target.value})}
                >
                    <option value="">All Modules</option>
                    <option value="BOOKING_OPERATIONS">Booking Ops</option>
                    <option value="FINANCE">Finance</option>
                    <option value="AUTH">Authentication</option>
                </select>
                <select
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-bold"
                    value={filters.role}
                    onChange={(e) => setFilters({...filters, role: e.target.value})}
                >
                    <option value="">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="CUSTOMER">Customer</option>
                </select>
                <Button variant="outline" className="rounded-xl gap-2 font-black uppercase tracking-widest text-[10px]" onClick={handleExportCSV}>
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            </div>

            <GlassCard className="overflow-hidden border-slate-100">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Module</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Performed By</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entity ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.logs.map((log: any) => (
                            <>
                                <TableRow
                                    key={log.id}
                                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                                    onClick={() => toggleRow(log.id)}
                                >
                                    <TableCell>
                                        {expandedRow === log.id ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                    </TableCell>
                                    <TableCell className="text-xs font-bold text-slate-500 whitespace-nowrap">
                                        {formatSafe(log.createdAt, "MMM d, HH:mm:ss")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="rounded-md text-[9px] font-black uppercase bg-slate-100 text-slate-500">
                                            {log.module}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-black text-slate-900 italic">
                                        {log.action.replace(/_/g, ' ')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn(
                                                "text-[8px] font-black uppercase",
                                                log.performedByRole === "ADMIN" ? "bg-rose-100 text-rose-600" :
                                                log.performedByRole === "VENDOR" ? "bg-blue-100 text-blue-600" :
                                                "bg-emerald-100 text-emerald-600"
                                            )}>
                                                {log.performedByRole}
                                            </Badge>
                                            <span className="text-xs font-bold text-slate-700">{log.performedByName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-slate-400">
                                        {log.bookingId || log.entityId}
                                    </TableCell>
                                </TableRow>
                                {expandedRow === log.id && (
                                    <TableRow className="bg-slate-50/30">
                                        <TableCell colSpan={6} className="p-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                        <Terminal className="h-3 w-3" /> Context Metadata
                                                    </h5>
                                                    <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">IP Address</p>
                                                            <p className="text-xs font-mono font-bold text-slate-900">{log.ipAddress || "N/A"}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Device</p>
                                                            <p className="text-xs font-bold text-slate-900">{log.device || "N/A"}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Request ID</p>
                                                            <p className="text-xs font-mono text-primary truncate max-w-[150px]">{log.requestId || "N/A"}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Browser</p>
                                                            <p className="text-xs font-bold text-slate-900">{log.browser} on {log.operatingSystem}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                        <History className="h-3 w-3" /> Value Changes
                                                    </h5>
                                                    <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                                                        <pre className="text-[10px] text-emerald-400 font-mono">
                                                            {JSON.stringify({
                                                                old: log.oldValue,
                                                                new: log.newValue
                                                            }, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        ))}
                    </TableBody>
                </Table>
            </GlassCard>

            <div className="flex justify-between items-center pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Showing {data?.logs.length || 0} of {data?.total || 0} records</p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                        className="rounded-lg font-black uppercase tracking-widest text-[9px]"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!data || (page + 1) * limit >= data.total}
                        onClick={() => setPage(page + 1)}
                        className="rounded-lg font-black uppercase tracking-widest text-[9px]"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
