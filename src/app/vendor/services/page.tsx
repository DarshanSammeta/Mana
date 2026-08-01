"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Store,
  Image as ImageIcon,
  ChevronRight,
  Star,
  Info,
  Search,
  Filter,
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { vendorService } from "@/services/client";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface ServiceData {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  Renamedpackage: any[];
  servicetype: {
    name: string;
    subcategory: {
      category: {
        name: string;
      };
    };
  };
}

export default function VendorServices() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const servicesRes = await vendorService.getServices();
      setServices(servicesRes);

      setStats({
        activeListings: servicesRes.length,
        totalPackages: servicesRes.reduce((acc: number, s: any) => acc + (s.Renamedpackage?.length || 0), 0),
        avgRating: "4.8" // Placeholder for actual aggregate logic
      });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch service listings." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const [stats, setStats] = useState({
    activeListings: 0,
    totalPackages: 0,
    avgRating: "0.0"
  });

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure? This will remove the listing and all associated pricing packages.")) return;
    try {
      await vendorService.deleteService(id);
      toast({ title: "Service Removed", description: "Your listing has been taken down." });
      fetchServices();
    } catch {
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not remove service." });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Page Header */}
      <div className="border-b border-border pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight italic uppercase">My Service Catalog</h1>
          <p className="text-muted-foreground mt-2 font-medium">Manage and optimize your marketplace listings for better visibility.</p>
        </div>
        <Link href="/vendor/services/new">
          <Button className="h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest px-8 shadow-xl shadow-primary/20 hover:scale-105 transition-transform gap-2">
            <Plus className="h-5 w-5" /> Add New Listing
          </Button>
        </Link>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Active Listings", value: stats.activeListings, icon: Store, color: "text-primary", bg: "bg-primary/5" },
          { label: "Total Packages", value: stats.totalPackages, icon: Package, color: "text-success", bg: "bg-success/5" },
          { label: "Partner Rating", value: stats.avgRating, icon: Star, color: "text-cta", bg: "bg-cta/5" },
        ].map((stat, i) => (
          <div key={i} className="bg-card p-6 border border-border rounded-[32px] shadow-sm flex items-center gap-6">
            <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center border border-border shadow-inner", stat.bg)}>
                <stat.icon className={cn("h-8 w-8", stat.color)} />
            </div>
            <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-3xl font-black text-foreground italic">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-card p-4 border border-border rounded-[24px] shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
                placeholder="Filter by title or category..."
                className="pl-12 pr-6 h-12 bg-muted/30 border border-border rounded-xl text-sm w-full font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card"
            />
        </div>
        <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                <Filter className="h-4 w-4" /> Advanced Filter
            </Button>
            <select className="h-12 px-4 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest bg-card outline-none focus:ring-2 focus:ring-primary/20">
                <option>Newest First</option>
                <option>Price: High to Low</option>
                <option>Price: Low to High</option>
            </select>
        </div>
      </div>

      {/* Listing Grid */}
      <div className="space-y-6">
        {loading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-[32px] border" />)
        ) : services.length > 0 ? (
          services.map((service) => (
            <div key={service.id} className="bg-card border border-border rounded-[32px] shadow-sm hover:border-primary/40 transition-all flex flex-col md:flex-row group overflow-hidden">
                <div className="w-full md:w-72 h-56 md:h-auto bg-muted relative shrink-0">
                    <ImageIcon className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <div className="px-3 py-1.5 bg-primary/90 backdrop-blur-md border border-primary/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg w-fit">
                            {service.servicetype?.subcategory?.category?.name || "Service"}
                        </div>
                        <div className="px-3 py-1 bg-card/90 backdrop-blur-md border border-border rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm w-fit">
                            {service.servicetype?.name}
                        </div>
                    </div>
                </div>
                <div className="flex-1 p-8 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors cursor-pointer tracking-tight italic uppercase">{service.title}</h3>
                            <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <Layers className="h-3.5 w-3.5" />
                                <span>{service.Renamedpackage?.length || 1} Pricing Plan(s)</span>
                                <span className="text-border">|</span>
                                <div className="flex items-center gap-1.5 text-success">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Active Listing
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/vendor/services/${service.id}`}>
                                <button className="p-3 rounded-2xl border border-border hover:bg-muted hover:text-primary transition-all shadow-sm">
                                    <Edit className="h-5 w-5" />
                                </button>
                            </Link>
                            <button
                                className="p-3 rounded-2xl border border-border hover:bg-destructive/10 hover:text-destructive transition-all shadow-sm"
                                onClick={() => handleDeleteService(service.id)}
                            ><Trash2 className="h-5 w-5" /></button>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-8 font-medium leading-relaxed italic">
                        {service.description}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-border/50">
                        <div className="flex items-baseline gap-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Base Price</span>
                            <span className="text-3xl font-black text-foreground italic tracking-tighter">₹{service.basePrice.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={`/vendor/services/${service.id}/packages`} className="flex-1 sm:flex-none">
                                <Button className="w-full bg-primary/10 text-primary border-none rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all shadow-none">
                                    <Package className="h-4 w-4 mr-2" /> Manage Packages
                                </Button>
                            </Link>
                            <button className="h-11 w-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-all">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Store}
            title="Your Storefront is Empty"
            description="Start attracting customers by creating your first service listing today."
            actionText="Create Listing"
            onActionClick={() => router.push("/vendor/services/new")}
          />
        )}
      </div>

      {/* Listing Optimization Tip */}
      <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10"><Info className="h-32 w-32" /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="h-20 w-20 rounded-3xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                <AlertCircle className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h4 className="text-xl font-black uppercase tracking-tight italic">Boost Your Conversion by 45%</h4>
                <p className="text-slate-400 mt-2 font-medium leading-relaxed max-w-2xl"> Listings with high-quality portfolio images and clear cancellation policies receive significantly more booking inquiries. Ensure your highlights are punchy and accurate.</p>
            </div>
            <Link href="/vendor/reports">
                <Button variant="secondary" className="rounded-xl h-14 px-8 font-black uppercase tracking-widest whitespace-nowrap">View Performance Analytics</Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
