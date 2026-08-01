"use client";

import { Star, Navigation } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocation } from "@/hooks/useLocation";
import { RATING_FILTERS } from "@/data/marketplace/filters";
import { cn } from "@/lib/utils";

interface MarketplaceFiltersProps {
  cities: string[];
}

export function MarketplaceFilters({ cities }: MarketplaceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { detectLocation } = useLocation();

  const [localMinPrice, setLocalMinPrice] = useState(searchParams?.get("minPrice") || "");
  const [localMaxPrice, setLocalMaxPrice] = useState(searchParams?.get("maxPrice") || "");
  const debouncedMin = useDebounce(localMinPrice, 500);
  const debouncedMax = useDebounce(localMaxPrice, 500);

  useEffect(() => {
    const urlMin = searchParams?.get("minPrice") || "";
    const urlMax = searchParams?.get("maxPrice") || "";
    setLocalMinPrice(urlMin);
    setLocalMaxPrice(urlMax);
  }, [searchParams]);

  const updateFilters = useCallback((updates: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    if (!updates.page) params.delete("page");
    router.replace(`/marketplace?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    const currentMin = searchParams?.get("minPrice") || "";
    const currentMax = searchParams?.get("maxPrice") || "";
    if (debouncedMin !== currentMin || debouncedMax !== currentMax) {
      updateFilters({
        minPrice: debouncedMin,
        maxPrice: debouncedMax
      });
    }
  }, [debouncedMin, debouncedMax, updateFilters, searchParams]);

  const rating = searchParams?.get("rating") ? parseInt(searchParams.get("rating")!) : 0;
  const selectedCity = searchParams?.get("city") || "";
  const sort = searchParams?.get("sort") || "featured";

  return (
    <div className="space-y-6 text-[#0F1111]">
      {/* Sort Section */}
      <div className="pb-6 border-b border-slate-100">
        <h3 className="text-sm font-bold mb-4">Sort by</h3>
        <select
          value={sort}
          onChange={(e) => updateFilters({ sort: e.target.value })}
          className="w-full bg-slate-50 border-slate-200 rounded-md h-9 px-3 text-sm font-medium focus:ring-1 focus:ring-orange-500 outline-none"
        >
          <option value="featured">Featured</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="rating">Avg. Customer Review</option>
          <option value="newest">Newest Arrivals</option>
          <option value="popularity">Best Sellers</option>
        </select>
      </div>

      {/* Rating Section */}
      <div className="pb-6 border-b border-slate-100">
        <h3 className="text-sm font-bold mb-4">Customer Review</h3>
        <div className="space-y-2">
          {RATING_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => updateFilters({ rating: rating === r ? 0 : r })}
              className={cn(
                "flex items-center gap-2 w-full text-left transition-colors group text-sm",
                rating === r ? 'font-bold' : 'hover:text-orange-600'
              )}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4 transition-colors", i < r ? 'fill-[#FFA41C] text-[#FFA41C]' : 'text-slate-200')} />
                ))}
              </div>
              <span className="text-xs">& Up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Section */}
      <div className="pb-6 border-b border-slate-100">
        <h3 className="text-sm font-bold mb-4">Price</h3>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
            <input
              placeholder="Min"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              className="w-full h-8 pl-5 pr-2 text-sm bg-white border border-slate-300 rounded focus:border-orange-500 outline-none"
            />
          </div>
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
            <input
              placeholder="Max"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              className="w-full h-8 pl-5 pr-2 text-sm bg-white border border-slate-300 rounded focus:border-orange-500 outline-none"
            />
          </div>
          <button
            onClick={() => updateFilters({ minPrice: localMinPrice, maxPrice: localMaxPrice })}
            className="h-8 px-3 bg-white border border-slate-300 rounded text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            Go
          </button>
        </div>
      </div>

      {/* City Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Location</h3>
          <button
            onClick={() => detectLocation(true)}
            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <Navigation className="h-3 w-3" /> Detect
          </button>
        </div>
        <div className="space-y-2">
          {cities.slice(0, 8).map((city) => (
            <label key={city} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCity === city}
                onChange={() => updateFilters({ city: selectedCity === city ? "" : city })}
                className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-[#0F1111] group-hover:text-orange-600">{city}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
