"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Check, X, ShieldAlert, RotateCcw, ExternalLink, Mail, Phone, MapPin, Building2, User } from "lucide-react";
import { adminService } from "@/services/client";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminVendorManagement() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [_total, _setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [page, _setPage] = useState(1);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getVendors({
        page,
        limit: 20,
        status: status === "ALL" ? "" : status,
        search
      });
      setVendors(data.vendors);
      _setTotal(data.pagination.total);
    } catch {
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleBulkAction = async (action: "APPROVE" | "REJECT" | "SUSPEND") => {
    if (selectedIds.length === 0) return;

    let reason = "";
    if (action === "REJECT" || action === "SUSPEND") {
      reason = window.prompt(`Please enter the reason for bulk ${action.toLowerCase()}:`) || "";
      if (!reason) return;
    }

    if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} ${selectedIds.length} vendors?`)) return;

    try {
      await adminService.bulkVendorAction({ ids: selectedIds, action, reason });
      toast.success(`Bulk ${action.toLowerCase()} completed`);
      setSelectedIds([]);
      fetchVendors();
    } catch {
      toast.error(`Failed to perform bulk ${action.toLowerCase()}`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === vendors.length) setSelectedIds([]);
    else setSelectedIds(vendors.map(v => v.id));
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleAction = async (id: string, action: string, businessName: string) => {
    const confirmMessage = `Are you sure you want to ${action} ${businessName}?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      if (action === "approve") await adminService.approveVendor(id);
      if (action === "reactivate") await adminService.reactivateVendor(id);
      if (action === "reject" || action === "suspend") {
        const reason = window.prompt(`Please enter the reason for ${action}:`);
        if (!reason) return;
        if (action === "reject") await adminService.rejectVendor(id, reason);
        else await adminService.suspendVendor(id, reason);
      }
      toast.success(`Vendor ${action}ed successfully`);
      fetchVendors();
    } catch {
      toast.error(`Failed to ${action} vendor`);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Vendor Management</h1>
          <p className="text-gray-500 font-medium">Approve, monitor and manage all platform vendors</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold h-12">
            Export Vendor Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative col-span-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by business name, owner or email..."
            className="pl-12 h-14 rounded-2xl border-gray-100 shadow-sm focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-14 rounded-2xl border-gray-100 font-bold gap-2">
          <Filter className="h-5 w-5" /> More Filters
        </Button>
      </div>

      <Tabs defaultValue="ALL" onValueChange={(val) => { setStatus(val); setSelectedIds([]); }} className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <TabsList className="bg-slate-100/50 p-1 rounded-2xl">
                <TabsTrigger value="ALL" className="rounded-xl px-8 py-2 font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">All Vendors</TabsTrigger>
                <TabsTrigger value="PENDING" className="rounded-xl px-8 py-2 font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">Pending</TabsTrigger>
                <TabsTrigger value="APPROVED" className="rounded-xl px-8 py-2 font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">Approved</TabsTrigger>
                <TabsTrigger value="SUSPENDED" className="rounded-xl px-8 py-2 font-black data-[state=active]:bg-white data-[state=active]:shadow-sm text-red-600">Suspended</TabsTrigger>
                <TabsTrigger value="REJECTED" className="rounded-xl px-8 py-2 font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">Rejected</TabsTrigger>
            </TabsList>

            {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                    <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} Selected</span>
                    <div className="h-4 w-[1px] bg-white/20 mx-2" />
                    <Button size="sm" onClick={() => handleBulkAction("APPROVE")} className="bg-green-600 hover:bg-green-700 h-8 font-black text-[10px] uppercase">Approve</Button>
                    <Button size="sm" onClick={() => handleBulkAction("SUSPEND")} variant="destructive" className="bg-amber-600 hover:bg-amber-700 h-8 font-black text-[10px] uppercase">Suspend</Button>
                    <Button size="sm" onClick={() => handleBulkAction("REJECT")} variant="destructive" className="h-8 font-black text-[10px] uppercase">Reject</Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} className="h-8 text-white/60 hover:text-white hover:bg-white/10 font-black text-[10px] uppercase">Cancel</Button>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {!loading && vendors.length > 0 && (
            <div className="flex items-center gap-4 px-6 py-2 bg-slate-50 rounded-2xl mb-2">
                 <Checkbox
                    checked={selectedIds.length === vendors.length && vendors.length > 0}
                    onCheckedChange={toggleSelectAll}
                 />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select All Vendors on this page</span>
            </div>
          )}
          {loading ? (
            <div className="py-20 text-center font-black text-gray-400">Loading Vendors...</div>
          ) : vendors.length === 0 ? (
            <div className="py-20 text-center font-black text-gray-400 bg-slate-50 rounded-3xl border-2 border-dashed">No vendors found matching your criteria</div>
          ) : (
            vendors.map((v) => (
              <Card key={v.id} className={cn("rounded-3xl border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300", selectedIds.includes(v.id) && "border-primary/30 bg-primary/5")}>
                <CardContent className="p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <Checkbox
                        checked={selectedIds.includes(v.id)}
                        onCheckedChange={() => toggleSelect(v.id)}
                    />
                    <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                        <Building2 className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-black text-gray-900 truncate">{v.businessName}</h3>
                            <StatusBadge status={v.verificationStatus} />
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {v.user.fullName}</span>
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {v.user.email}</span>
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {v.user.mobileNumber}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {v.city}, {v.state}</span>
                        </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 px-8 border-x border-slate-100 hidden xl:flex">
                     <Stat label="Rating" value={`${v.rating} (${v.reviewCount})`} />
                     <Stat label="Bookings" value={v.totalBookings} />
                     <Stat label="Reliability" value={`${v.reliabilityScore}%`} />
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl border-gray-100"
                      asChild
                    >
                      <Link href={`/admin/vendors/${v.id}`}><ExternalLink className="h-4 w-4" /></Link>
                    </Button>

                    {v.verificationStatus === 'PENDING' && (
                        <>
                            <Button
                                onClick={() => handleAction(v.id, "approve", v.businessName)}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-black px-6"
                            >
                                <Check className="h-4 w-4 mr-2" /> Approve
                            </Button>
                            <Button
                                onClick={() => handleAction(v.id, "reject", v.businessName)}
                                variant="destructive"
                                className="rounded-xl font-black px-6"
                            >
                                <X className="h-4 w-4 mr-2" /> Reject
                            </Button>
                        </>
                    )}

                    {v.verificationStatus === 'APPROVED' && (
                        <Button
                            onClick={() => handleAction(v.id, "suspend", v.businessName)}
                            variant="destructive"
                            className="bg-amber-600 hover:bg-amber-700 rounded-xl font-black px-6"
                        >
                            <ShieldAlert className="h-4 w-4 mr-2" /> Suspend
                        </Button>
                    )}

                    {v.verificationStatus === 'SUSPENDED' && (
                        <Button
                            onClick={() => handleAction(v.id, "reactivate", v.businessName)}
                            className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black px-6"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" /> Reactivate
                        </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
    const config: any = {
        PENDING: "bg-amber-100 text-amber-700 border-amber-200",
        UNDER_REVIEW: "bg-blue-100 text-blue-700 border-blue-200",
        APPROVED: "bg-green-100 text-green-700 border-green-200",
        REJECTED: "bg-red-100 text-red-700 border-red-200",
        SUSPENDED: "bg-gray-100 text-gray-700 border-gray-200",
    };

    return (
        <Badge className={cn("rounded-lg font-black text-[10px] tracking-wider px-3 py-0.5 border", config[status])}>
            {status}
        </Badge>
    );
}

function Stat({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-black text-gray-900">{value}</p>
        </div>
    );
}
