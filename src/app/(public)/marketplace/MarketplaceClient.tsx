"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/common/Navbar";
import {
  Search,
  MapPin,
  Star,
  Sparkles,
  Map as MapIcon,
  ChevronDown,
  LayoutGrid,
  List,
  X,
  ChevronRight,
  Zap,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { VendorCard } from "@/components/marketplace/VendorCard";
import { VendorCardSkeleton } from "@/components/marketplace/VendorCardSkeleton";
import { MarketplaceSkeleton } from "@/components/marketplace/MarketplaceSkeleton";
import { VendorMapView } from "@/components/marketplace/VendorMapView";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import Image from "next/image";

import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "@/store/locationStore";
import { EmptyState } from "@/components/common/EmptyState";

export default function MarketplaceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { city: globalCity, lat, lng, address: globalAddress, setLocation, setCity, setAddress } = useLocationStore();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");

  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(searchParams?.get("subcategory") ?? null);
  const [isSubPanelExpanded, setIsSubPanelExpanded] = useState(true);
  const [localSearch, setLocalSearch] = useState("");
  const [quickViewVendor, setQuickViewVendor] = useState<any>(null);

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const categoryParam = searchParams?.get("category");
  const subcategoryParam = searchParams?.get("subcategory");
  const cityParam = searchParams?.get("city") || globalCity || "";
  const queryParam = searchParams?.get("query") || "";

  const [filters, setFilters] = useState({
    city: cityParam,
    query: queryParam,
    minPrice: "",
    maxPrice: "",
    rating: 0,
    sort: "featured",
    smartMatch: true
  });

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "Photography");

  // Geolocation detection
  useEffect(() => {
    if (!lat || !lng) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setLocation(latitude, longitude);

            try {
              const res = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
              if (res.data.results?.[0]) {
                const result = res.data.results[0];
                setAddress(result.formatted_address);
                const cityComp = result.address_components.find((c: any) => c.types.includes("locality"));
                if (cityComp) setCity(cityComp.long_name);
              }
            } catch (err) {
              console.error("Reverse geocoding failed", err);
            }
          },
          (error) => {
            console.warn("Geolocation error:", error.message || "User denied or unavailable");
          }
        );
      }
    }
  }, []);

  // Sync state with URL parameters
  useEffect(() => {
    const category = searchParams?.get("category");
    const subcategory = searchParams?.get("subcategory") ?? null;
    const query = searchParams?.get("query") || "";
    const city = searchParams?.get("city") || "";

    if (category && category !== selectedCategory) {
      setSelectedCategory(category);
    }

    if (subcategory !== selectedSubcategory) {
      setSelectedSubcategory(subcategory);
    }

    if (query !== filters.query || (city && city !== filters.city)) {
      setFilters(prev => ({
        ...prev,
        query,
        city: city || prev.city
      }));
    }

    if (query) setLocalSearch(query);
  }, [searchParams]);

  const updateUrl = (newCategory?: string, newSubcategory?: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (newCategory) {
      params.set("category", newCategory);
      params.delete("subcategory");
      setSelectedCategory(newCategory);
      setSelectedSubcategory(null);
    } else if (newSubcategory !== undefined) {
      if (newSubcategory) params.set("subcategory", newSubcategory);
      else params.delete("subcategory");
      setSelectedSubcategory(newSubcategory);
    }
    router.push(`/marketplace?${params.toString()}`);
  };

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axios.get("/api/categories");
      return res.data;
    },
  });

  const { data: vendors, isLoading: loading } = useQuery({
    queryKey: ["marketplace", filters, selectedCategory, selectedSubcategory, globalCity, lat, lng, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      const currentCategory = selectedSubcategory || selectedCategory;
      const currentCity = filters.city || globalCity;
      const currentQuery = debouncedSearch || filters.query;

      if (currentCategory) params.append("category", currentCategory);
      if (currentCity) params.append("city", currentCity);
      if (currentQuery) params.append("query", currentQuery);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.rating) params.append("rating", filters.rating.toString());
      if (filters.sort) params.append("sort", filters.sort);

      if (filters.smartMatch && lat && lng) {
        params.append("lat", lat.toString());
        params.append("lng", lng.toString());
      }

      const res = await axios.get(`/api/marketplace?${params.toString()}`);
      return res.data.vendors || [];
    },
  });

  const activeCategoryData = categories?.find((c: any) => c.name === selectedCategory);

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    if (!localSearch) return vendors;
    return vendors.filter((v: any) =>
      v.businessName.toLowerCase().includes(localSearch.toLowerCase())
    );
  }, [vendors, localSearch]);

  const featuredVendors = useMemo(() => {
    if (!vendors) return [];
    return [...vendors]
      .sort((a, b) => (parseFloat(b.rating) * b.reviewCount) - (parseFloat(a.rating) * a.reviewCount))
      .slice(0, 5);
  }, [vendors]);

  const startingPrice = vendors?.length > 0
    ? Math.min(...vendors.map((v: any) => parseFloat(v.basePrice)).filter((p: number) => !isNaN(p)))
    : 0;

  const cities = ["Hyderabad", "Mumbai", "Bangalore", "Delhi", "Chennai", "Pune"];

  if (categoriesLoading || (loading && !vendors)) {
    return <MarketplaceSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      {/* Mobile Search & Filter Bar */}
      <div className="lg:hidden bg-white border-b border-border px-4 py-3 sticky top-[64px] z-30">
        <div className="flex gap-2">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input
                placeholder="Search vendors..."
                className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-full text-sm focus-visible:ring-primary/20"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
               />
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="h-11 w-11 p-0 rounded-full border-slate-200 bg-slate-50 shrink-0">
                        <Filter className="h-4 w-4 text-slate-600" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] h-[90vh] overflow-y-auto p-0 gap-0">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle>Filters</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 pb-20">
                        <MarketplaceFilters
                          filters={filters}
                          setFilters={setFilters}
                          cities={cities}
                        />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                        <DialogTrigger asChild>
                            <Button className="w-full bg-primary h-12 rounded-xl font-bold">Show {filteredVendors.length} Results</Button>
                        </DialogTrigger>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Expandable Selected Category Services */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-border overflow-hidden"
          >
            <div className="max-w-[1500px] mx-auto px-4 py-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-secondary tracking-tight">
                    {selectedCategory} <span className="text-primary/60 font-medium">Services</span>
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSubPanelExpanded(!isSubPanelExpanded)}
                  className="text-slate-500 font-bold hover:text-primary transition-colors"
                >
                  {isSubPanelExpanded ? "Hide Services" : "Show Services"}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-300 ${isSubPanelExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {categoriesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : isSubPanelExpanded && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <button
                    onClick={() => updateUrl(undefined, null)}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${
                      !selectedSubcategory
                        ? "border-[#6D28D9] bg-[#F3E8FF] shadow-sm"
                        : "border-slate-100 bg-slate-50/50 hover:border-[#6D28D9]/30 hover:bg-white"
                    }`}
                  >
                    <Zap className={`h-6 w-6 mb-3 ${!selectedSubcategory ? 'text-[#6D28D9]' : 'text-slate-400'}`} />
                    <span className={`text-xs font-black uppercase tracking-wider ${!selectedSubcategory ? 'text-[#6D28D9]' : 'text-slate-600'}`}>All Services</span>
                  </button>
                  {activeCategoryData?.subcategory?.map((sub: any) => (
                    <button
                      key={sub.id}
                      onClick={() => updateUrl(undefined, sub.name)}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${
                        selectedSubcategory === sub.name
                          ? "border-[#6D28D9] bg-[#F3E8FF] shadow-sm"
                          : "border-slate-100 bg-slate-50/50 hover:border-[#6D28D9]/30 hover:bg-white"
                      }`}
                    >
                      <Sparkles className={`h-6 w-6 mb-3 ${selectedSubcategory === sub.name ? 'text-[#6D28D9]' : 'text-slate-400'}`} />
                      <span className={`text-xs font-black uppercase tracking-wider line-clamp-1 ${selectedSubcategory === sub.name ? 'text-[#6D28D9]' : 'text-slate-600'}`}>{sub.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="sticky top-32">
             <MarketplaceFilters
               filters={filters}
               setFilters={setFilters}
               cities={cities}
             />
          </div>
        </aside>

        <div className="flex-1">
          <div className="bg-card p-4 rounded-xl border border-border mb-6 flex items-center justify-between">
            <div className="text-sm">
               <span className="font-bold">{filteredVendors.length} results</span> <span className="hidden sm:inline">for</span> <Badge variant="outline" className="ml-1">{selectedSubcategory || selectedCategory}</Badge>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
               <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-card text-primary' : 'text-muted-foreground'}`}><LayoutGrid className="h-4 w-4" /></button>
               <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-card text-primary' : 'text-muted-foreground'}`}><List className="h-4 w-4" /></button>
               <button onClick={() => setViewMode("map")} className={`p-1.5 rounded ${viewMode === 'map' ? 'bg-card text-primary' : 'text-muted-foreground'}`}><MapIcon className="h-4 w-4" /></button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                {[...Array(6)].map((_, i) => <VendorCardSkeleton key={i} />)}
              </div>
            ) : filteredVendors.length > 0 ? (
              viewMode === "map" ? (
                <VendorMapView vendors={filteredVendors} center={{ lat: lat || 17.3850, lng: lng || 78.4867 }} />
              ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6" : "space-y-6"}>
                  {filteredVendors.map((vendor: any, i: number) => (
                    <VendorCard key={vendor.id} vendor={vendor} index={i} viewMode={viewMode} onQuickView={(v: any) => setQuickViewVendor(v)} />
                  ))}
                </div>
              )
            ) : (
              <EmptyState
                icon={Search}
                title="No matching vendors found"
                description={`We couldn't find any results for "${localSearch || selectedSubcategory || selectedCategory}" in ${filters.city || 'all cities'}. Try adjusting your filters or search terms.`}
                actionText="Clear All Filters"
                onActionClick={() => {
                  setFilters({
                    city: "",
                    query: "",
                    minPrice: "",
                    maxPrice: "",
                    rating: 0,
                    sort: "featured",
                    smartMatch: true
                  });
                  setLocalSearch("");
                  updateUrl("Photography", null);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <Dialog open={!!quickViewVendor} onOpenChange={() => setQuickViewVendor(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-2xl">
          {quickViewVendor && (
            <div className="flex flex-col md:flex-row h-full">
              <div className="md:w-1/2 h-64 md:h-auto relative">
                <Image src={quickViewVendor.coverImage || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800"} fill className="object-cover" alt={quickViewVendor.businessName} />
              </div>
              <div className="md:w-1/2 p-8 flex flex-col justify-between">
                <div>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{quickViewVendor.businessName}</DialogTitle>
                    <DialogDescription className="mt-4">{quickViewVendor.city} • {quickViewVendor.rating} Rating</DialogDescription>
                  </DialogHeader>
                  <div className="mt-8 bg-muted p-4 rounded-lg">
                    <p className="text-xs uppercase font-bold text-muted-foreground">Starting Price</p>
                    <p className="text-2xl font-bold text-primary">₹{quickViewVendor.basePrice}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <Link href={`/marketplace/vendor/${quickViewVendor.id}`} className="flex-1"><Button className="w-full">View Profile</Button></Link>
                  <Button variant="outline" className="flex-1">Compare</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MarketplaceFilters({ filters, setFilters, cities }: any) {
  return (
    <div className="space-y-8 bg-white p-6 lg:p-0 rounded-2xl lg:border-none shadow-none">
      <div>
        <h3 className="text-[11px] font-black mb-6 uppercase tracking-widest text-slate-400">Customer Rating</h3>
        <div className="space-y-4">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setFilters((prev: any) => ({ ...prev, rating: r === prev.rating ? 0 : r }))}
              className={`flex items-center gap-3 w-full text-left transition-colors group ${filters.rating === r ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 transition-colors ${i < r ? 'fill-accent text-accent' : 'text-slate-100 group-hover:text-slate-200'}`} />
                ))}
              </div>
              <span className={`text-sm font-bold ${filters.rating === r ? 'opacity-100' : 'opacity-60'}`}>& Up</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-black mb-6 uppercase tracking-widest text-slate-400">Budget Range</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                <Input placeholder="Min" value={filters.minPrice} onChange={(e) => setFilters((prev: any) => ({ ...prev, minPrice: e.target.value }))} className="h-10 pl-6 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-primary/20" />
             </div>
             <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                <Input placeholder="Max" value={filters.maxPrice} onChange={(e) => setFilters((prev: any) => ({ ...prev, maxPrice: e.target.value }))} className="h-10 pl-6 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-primary/20" />
             </div>
          </div>
          <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold h-10 rounded-lg shadow-sm border-none">Apply Price</Button>
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-black mb-6 uppercase tracking-widest text-slate-400">Popular Cities</h3>
        <div className="space-y-3">
          {cities.map((city: string) => (
            <label key={city} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                 <input type="checkbox" checked={filters.city === city} onChange={() => setFilters((prev: any) => ({ ...prev, city: prev.city === city ? "" : city }))} className="peer h-5 w-5 rounded-md border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer" />
              </div>
              <span className="text-sm font-semibold text-slate-600 group-hover:text-secondary transition-colors">{city}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
