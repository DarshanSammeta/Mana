"use client";

import { useState, useEffect } from "react";
import { vendorService } from "@/services/client";
import {
  Package,
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  Copy,
  Filter,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PackageData {
  id: string;
  name: string;
  price: number;
  status: string;
  serviceName: string;
  inclusions: string[];
}

export default function VendorPackages() {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const services = await vendorService.getServices();

        if (services && services.length > 0) {
            const allPackages = await Promise.all(
                services.map(async (service: { id: string; title: string }) => {
                    const pkgs = await vendorService.getPackagesByService(service.id);
                    return pkgs.map((p: any) => ({ ...p, serviceName: service.title }));
                })
            );
            setPackages(allPackages.flat());
        }
      } catch (err) {
        console.error("Failed to fetch packages", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Service Packages</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure tiered pricing and deliverables for your service listings.</p>
        </div>
        <button className="px-4 py-1.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 shadow-sm transition-all hover:shadow-md flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create New Package
        </button>
      </div>

      {/* Utilities */}
      <div className="bg-card p-3 border border-border rounded-xl shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
                placeholder="Search packages by name or ID..."
                className="pl-8 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-card transition-all"
            />
        </div>
        <div className="flex items-center gap-2">
            <select className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium bg-card text-foreground outline-none focus:ring-1 focus:ring-primary/50">
                <option>Filter by Service: All</option>
                <option>Catering</option>
                <option>Photography</option>
            </select>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-muted/50 text-foreground transition-colors">
                <Filter className="h-3.5 w-3.5" /> Sort
            </button>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl border border-border" />)
        ) : (
            packages.map((pkg) => (
                <div key={pkg.id} className="bg-card border border-border rounded-2xl shadow-sm hover:border-primary/30 transition-all flex flex-col group relative overflow-hidden">
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                            pkg.status === "Active" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
                        )}>
                            {pkg.status}
                        </span>
                    </div>

                    <div className="p-5 flex-1">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{pkg.serviceName}</p>
                                <h3 className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">{pkg.name}</h3>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{pkg.id}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-foreground">₹ {pkg.price?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-border/50">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Layers className="h-3 w-3" />
                                    <span>Deliverables</span>
                                </div>
                                <p className="text-sm font-bold text-foreground">{pkg.inclusions?.length || 0} items</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-muted/30 border-t border-border flex items-center gap-2">
                        <button className="flex-1 py-1.5 bg-card border border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                            <Edit2 className="h-3 w-3" /> Edit Package
                        </button>
                        <button className="p-1.5 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 shadow-sm transition-all" title="Duplicate">
                            <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1.5 bg-card border border-border rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shadow-sm transition-all" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            ))
        )}

        {/* Add New Placeholder */}
        {!loading && (
            <button className="bg-muted/20 border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-muted/40 hover:border-primary/50 transition-all group min-h-[260px]">
                <div className="h-12 w-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/50 transition-all shadow-sm">
                    <Plus className="h-6 w-6" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-foreground">Add New Package</p>
                    <p className="text-xs text-muted-foreground mt-1">Design a new pricing tier</p>
                </div>
            </button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-card border border-border rounded-2xl p-4 flex gap-4 shadow-sm">
        <div className="h-10 w-10 rounded-full bg-cta/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-cta" />
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
            <p className="font-bold text-foreground mb-1 uppercase tracking-tight text-[10px]">Package Strategy</p>
            Sellers who offer at least three tiers (e.g., Basic, Standard, Premium) typically see a 30% increase in average order value.
            Customers like having choices that fit their specific budget and event scale.
            <button className="text-primary font-bold hover:underline ml-1">View Strategy Guide</button>
        </div>
      </div>
    </div>
  );
}
