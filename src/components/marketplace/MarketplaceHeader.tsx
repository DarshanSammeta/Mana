"use client";

import { Search, Filter, LayoutGrid, List, Map as MapIcon, ChevronRight, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MarketplaceFilters } from "./MarketplaceFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import { useSavedSearchesStore } from "@/store/useSavedSearchesStore";
import { useLocationStore } from "@/store/locationStore";
import { toast } from "react-hot-toast";
import { Bookmark } from "lucide-react";

interface MarketplaceHeaderProps {
  totalResults: number;
  viewMode: "grid" | "list" | "map";
  setViewMode: (mode: "grid" | "list" | "map") => void;
  cities: string[];
}

export function MarketplaceHeader({ totalResults, viewMode, setViewMode, cities }: MarketplaceHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveSearch } = useSavedSearchesStore();
  const { locality, city } = useLocationStore();
  const [localSearch, setLocalSearch] = useState(searchParams?.get("query") || "");

  const handleSaveSearch = () => {
    const filters = Object.fromEntries(searchParams?.entries() || []);
    const name = selectedSubcategory || selectedCategory || eventNameParam || localSearch || "My Search";
    const url = window.location.href;
    saveSearch(name, url, filters);
    toast.success("Search saved to your account");
  };

  const eventNameParam = searchParams?.get("eventName") || "All Events";
  const selectedCategory = searchParams?.get("category");
  const selectedSubcategory = searchParams?.get("subcategory");

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (localSearch) params.set("query", localSearch);
      else params.delete("query");
      router.push(`/marketplace?${params.toString()}`, { scroll: false });
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch, router, searchParams]);

  return (
    <>
      {/* Mobile Search & Filter Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-[64px] z-30 shadow-sm">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search vendors..."
              className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl text-sm focus-visible:ring-primary/20 transition-all"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" aria-label="Open Filters" className="h-12 w-12 p-0 rounded-xl border-slate-200 bg-slate-50 shrink-0 hover:bg-slate-100 transition-colors">
                <Filter className="h-5 w-5 text-slate-600" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] h-[90vh] overflow-y-auto p-0 gap-0">
              <DialogHeader className="p-6 border-b">
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              <div className="p-6 pb-20">
                <MarketplaceFilters cities={cities} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary h-12 rounded-xl font-bold">Show Results</Button>
                </DialogTrigger>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">{totalResults} results for</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className="bg-primary text-white border-none px-3 py-1 font-bold">{eventNameParam}</Badge>
            {selectedCategory && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <Badge className="bg-blue-600 text-white hover:bg-blue-700 border-none px-3 py-1 font-bold">{selectedCategory}</Badge>
              </>
            )}
            {(locality || city) && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <Badge className="bg-emerald-600 text-white border-none px-3 py-1 font-bold flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {locality || city}
                </Badge>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveSearch}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 gap-2 ml-4 hidden sm:flex"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Save Search
          </Button>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="h-5 w-5" /></button>
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List className="h-5 w-5" /></button>
          <button onClick={() => setViewMode("map")} className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><MapIcon className="h-5 w-5" /></button>
        </div>
      </div>
    </>
  );
}
