"use client";

import { Star, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocationStore } from "@/store/locationStore";
import { useLocation } from "@/hooks/useLocation";
import { RATING_FILTERS } from "@/data/marketplace/filters";

interface MarketplaceFiltersProps {
  cities: string[];
}

export function MarketplaceFilters({ cities }: MarketplaceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lat = useLocationStore(state => state.lat);
  const lng = useLocationStore(state => state.lng);
  const { detectLocation } = useLocation();

  const [localMinPrice, setLocalMinPrice] = useState(searchParams?.get("minPrice") || "");
  const [localMaxPrice, setLocalMaxPrice] = useState(searchParams?.get("maxPrice") || "");
  const debouncedMin = useDebounce(localMinPrice, 500);
  const debouncedMax = useDebounce(localMaxPrice, 500);

  // Sync local state with URL changes (for multi-instance sync)
  useEffect(() => {
    const urlMin = searchParams?.get("minPrice") || "";
    const urlMax = searchParams?.get("maxPrice") || "";

    if (urlMin !== localMinPrice) setLocalMinPrice(urlMin);
    if (urlMax !== localMaxPrice) setLocalMaxPrice(urlMax);
  }, [searchParams, localMinPrice, localMaxPrice]);

  const updateFilters = useCallback((updates: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    // Automatically inject coordinates if available for proximity ranking
    if (lat && lng) {
      params.set("lat", lat.toString());
      params.set("lng", lng.toString());
    }

    // Reset to page 1 when filters change
    if (!updates.page) params.delete("page");

    router.replace(`/marketplace?${params.toString()}`, { scroll: false });
  }, [router, searchParams, lat, lng]);

  useEffect(() => {
    const currentMin = searchParams?.get("minPrice") || "";
    const currentMax = searchParams?.get("maxPrice") || "";

    // Only update if the debounced value actually differs from the URL
    if (debouncedMin !== currentMin || debouncedMax !== currentMax) {
      updateFilters({
        minPrice: debouncedMin,
        maxPrice: debouncedMax
      });
    }
  }, [debouncedMin, debouncedMax, updateFilters, searchParams, localMinPrice, localMaxPrice]);

  const rating = searchParams?.get("rating") ? parseInt(searchParams.get("rating")!) : 0;
  const selectedCity = searchParams?.get("city") || "";
  const sort = searchParams?.get("sort") || "featured";

  return (
    <div className="space-y-8 bg-white p-6 lg:p-0 rounded-2xl lg:border-none shadow-none">
      <div>
        <h3 className="text-[11px] font-black mb-6 uppercase tracking-widest text-slate-400">Sort By</h3>
        <select
          value={sort}
          onChange={(e) => updateFilters({ sort: e.target.value })}
          className="w-full bg-slate-50 border-slate-200 rounded-xl h-11 px-4 text-sm font-bold focus:ring-primary/20 transition-all outline-none"
        >
          <option value="featured">Featured (Recommended)</option>
          <option value="nearby">Nearby Professionals</option>
          <option value="rating">Highest Rated</option>
          <option value="popularity">Most Popular</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      <div>
        <h3 className="text-[11px] font-black mb-6 uppercase tracking-widest text-slate-400">Customer Rating</h3>
        <div className="space-y-4">
          {RATING_FILTERS.map((r) => (
            <button
              key={r}
              aria-label={`${r} stars and up`}
              onClick={() => updateFilters({ rating: rating === r ? 0 : r })}
              className={`flex items-center gap-3 w-full text-left transition-colors group ${rating === r ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 transition-colors ${i < r ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-slate-100 group-hover:text-slate-200'}`} />
                ))}
              </div>
              <span className={`text-sm font-bold ${rating === r ? 'opacity-100' : 'opacity-60'}`}>& Up</span>
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
              <Input
                placeholder="Min"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value)}
                className="h-10 pl-6 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-primary/20"
              />
            </div>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
              <Input
                placeholder="Max"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
                className="h-10 pl-6 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Popular Cities</h3>
          <button
            onClick={() => detectLocation(true)}
            className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1 hover:underline"
          >
            <Navigation className="h-3 w-3" /> Detect
          </button>
        </div>
        <div className="space-y-3">
          {cities.map((city: string) => (
            <label key={city} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedCity === city}
                  onChange={() => updateFilters({ city: selectedCity === city ? "" : city })}
                  className="peer h-5 w-5 rounded-md border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                />
              </div>
              <span className="text-sm font-semibold text-slate-600 group-hover:text-secondary transition-colors">{city}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
