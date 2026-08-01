"use client";

import { Filter, LayoutGrid, List, Map as MapIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MarketplaceFilters } from "./MarketplaceFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface MarketplaceHeaderProps {
  totalResults: number;
  viewMode: "grid" | "list" | "map";
  setViewMode: (mode: "grid" | "list" | "map") => void;
  cities: string[];
}

export function MarketplaceHeader({ totalResults, viewMode, setViewMode, cities }: MarketplaceHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams?.get("query") || "";
  const selectedCategory = searchParams?.get("category");
  const selectedCity = searchParams?.get("city");

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete(key);
    router.replace(`/marketplace?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Result Count & Breadcrumbs */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#0F1111]">
            <span className="font-bold">{totalResults.toLocaleString()} results</span>
            {currentQuery && <span> for <span className="text-[#C7511F] font-bold">&quot;{currentQuery}&quot;</span></span>}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            {selectedCategory && (
              <Badge variant="outline" className="bg-slate-50 border-slate-200 text-xs font-medium py-1 gap-1">
                {selectedCategory}
                <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeFilter("category")} />
              </Badge>
            )}
            {selectedCity && (
              <Badge variant="outline" className="bg-slate-50 border-slate-200 text-xs font-medium py-1 gap-1">
                {selectedCity}
                <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeFilter("city")} />
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded transition-all",
                viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded transition-all",
                viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "p-1.5 rounded transition-all",
                viewMode === "map" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <MapIcon className="h-4 w-4" />
            </button>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="lg:hidden h-9 rounded-md border-slate-200 bg-white font-bold text-xs gap-2">
                <Filter className="h-3.5 w-3.5" /> Filters
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Refine Results</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <MarketplaceFilters cities={cities} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
